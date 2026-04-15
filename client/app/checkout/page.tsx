"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { getAccessToken } from "@/lib/auth-storage";
import {
  completeBookingPayment,
  createRazorpayOrder,
  createBooking,
  fetchPublicShowSeatMap,
  PublicShowSeatMap,
  UserApiError,
  verifyRazorpayPayment,
} from "@/lib/user-api";

declare global {
  interface Window {
    Razorpay?: new (
      options: Record<string, unknown>,
    ) => {
      open: () => void;
      on: (event: string, callback: (response: Record<string, string>) => void) => void;
    };
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-8 py-10">
        <p className="text-on-surface-variant">Loading checkout...</p>
      </main>
      <Footer />
    </div>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const showId = Number(searchParams.get("showId") || "");
  const seatIds = (searchParams.get("seatIds") || "")
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);

  const [showData, setShowData] = useState<PublicShowSeatMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);

  useEffect(() => {
    setAccessToken(getAccessToken());
  }, []);

  useEffect(() => {
    const existing = document.querySelector('script[data-razorpay="true"]');
    if (existing) {
      setIsRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "true";
    script.onload = () => setIsRazorpayReady(true);
    script.onerror = () => setError("Unable to load Razorpay checkout. Please refresh and try again.");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!showId || seatIds.length === 0) {
      setError("Missing show or seats. Please choose seats again.");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const data = await fetchPublicShowSeatMap(showId, getAccessToken());
        setShowData(data);
      } catch (loadError) {
        const message =
          loadError instanceof UserApiError ? loadError.message : "Unable to load checkout details.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [showId, seatIds.length]);

  const selectedSeats = useMemo(() => {
    if (!showData) return [];
    return showData.seats.filter((seat) => seatIds.includes(seat.id));
  }, [showData, seatIds]);

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
  const nextPath = `/checkout?showId=${showId}&seatIds=${seatIds.join(",")}`;

  const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`;

  const handlePay = async () => {
    if (!showData || !accessToken) return;

    try {
      setError("");
      setIsSubmitting(true);

      const booking = await createBooking(accessToken, {
        showId: showData.id,
        showSeatIds: selectedSeats.map((seat) => seat.id),
      });

      const order = await createRazorpayOrder(accessToken, booking.id);
      if (!window.Razorpay) {
        throw new UserApiError("Razorpay checkout is unavailable in this browser.");
      }
      const RazorpayCtor = window.Razorpay;

      await new Promise<void>((resolve, reject) => {
        const rzp = new RazorpayCtor({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Book My Ticket",
          description: `${showData.movie.title} tickets`,
          order_id: order.orderId,
          handler: async (response: Record<string, string>) => {
            try {
              const verified = await verifyRazorpayPayment(accessToken, booking.id, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              router.push(`/bookings/${verified.id}`);
              resolve();
            } catch (verifyError) {
              reject(verifyError);
            }
          },
          modal: {
            ondismiss: async () => {
              try {
                await completeBookingPayment(accessToken, booking.id, false);
              } catch {
                // Best effort: keep booking state clean when user dismisses payment.
              }
              reject(new UserApiError("Payment was cancelled."));
            },
          },
          prefill: {
            email: "",
            name: "",
            contact: "",
          },
          notes: {
            bookingId: booking.id,
          },
          theme: {
            color: "#5B7CFA",
          },
        });

        rzp.on("payment.failed", async () => {
          try {
            await completeBookingPayment(accessToken, booking.id, false);
          } catch {
            // Best effort: keep booking state clean on provider failure callback.
          }
          reject(new UserApiError("Payment failed. Please try again."));
        });

        rzp.open();
      });
    } catch (submitError) {
      const message =
        submitError instanceof UserApiError
          ? submitError.message
          : "Unable to complete booking right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-8 py-10 space-y-6">
        <h1 className="text-3xl font-headline font-black">Checkout</h1>

        {isLoading ? <p className="text-on-surface-variant">Loading checkout details...</p> : null}

        {error ? <div className="clay-card rounded-xl p-4 bg-red-100/70 text-red-700">{error}</div> : null}

        {showData && !isLoading ? (
          <div className="space-y-5">
            <section className="clay-card rounded-xl p-6 space-y-2">
              <h2 className="text-xl font-bold">{showData.movie.title}</h2>
              <p className="text-on-surface-variant">
                {showData.theater.name} • {showData.screen.name}
              </p>
              <p className="text-on-surface-variant">{formatDateTime(showData.startTime)}</p>
            </section>

            <section className="clay-card rounded-xl p-6 space-y-3">
              <h3 className="text-lg font-bold">Seats</h3>
              <p className="text-on-surface">
                {selectedSeats.length
                  ? selectedSeats.map((seat) => seat.screenSeat.seatLabel).join(", ")
                  : "No seats selected"}
              </p>

              <div className="space-y-1 text-sm">
                {selectedSeats.map((seat) => (
                  <div key={seat.id} className="flex items-center justify-between">
                    <span>
                      {seat.screenSeat.seatLabel} ({seat.screenSeat.seatType})
                    </span>
                    <span className="font-semibold">Rs. {seat.price}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-surface-container-high flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>Rs. {totalAmount.toFixed(2)}</span>
              </div>
            </section>

            {!accessToken ? (
              <section className="clay-card rounded-xl p-6 space-y-3">
                <p className="text-on-surface-variant">Please login to confirm your booking.</p>
                <Link href={loginUrl}>
                  <Button>Login to Continue</Button>
                </Link>
              </section>
            ) : (
              <section className="clay-card rounded-xl p-6 space-y-3">
                <p className="text-on-surface-variant text-sm">
                  Secure payment via Razorpay. Your seats are held temporarily while payment is in progress.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void handlePay()} disabled={isSubmitting || selectedSeats.length === 0 || !isRazorpayReady}>
                    {isSubmitting ? "Processing..." : isRazorpayReady ? "Pay with Razorpay" : "Loading Razorpay..."}
                  </Button>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
