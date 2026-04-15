"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getAccessToken } from "@/lib/auth-storage";
import { BookingDetails, cancelBooking, fetchMyBookings, UserApiError } from "@/lib/user-api";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyBookingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<BookingDetails | null>(null);

  const loginUrl = `/login?next=${encodeURIComponent("/bookings")}`;

  useEffect(() => {
    setAccessToken(getAccessToken());
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const data = await fetchMyBookings(accessToken);
        setBookings(data);
      } catch (loadError) {
        const message =
          loadError instanceof UserApiError ? loadError.message : "Unable to load bookings.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [accessToken]);

  const isCancellationEligible = (booking: BookingDetails) => {
    const timeUntilShow = new Date(booking.show.startTime).getTime() - Date.now();
    return booking.status === "PAID" && booking.payment?.status === "CAPTURED" && timeUntilShow > 24 * 60 * 60 * 1000;
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!accessToken) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setCancellingBookingId(bookingId);
      const updated = await cancelBooking(accessToken, bookingId);
      setBookings((current) => current.map((booking) => (booking.id === bookingId ? updated : booking)));
      setSuccessMessage("Amount refunded successfully. Seats are released and available for booking.");
    } catch (cancelError) {
      const message =
        cancelError instanceof UserApiError ? cancelError.message : "Unable to cancel booking right now.";
      setError(message);
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 py-10 space-y-6">
        <h1 className="text-3xl font-headline font-black">My Bookings</h1>

        {!accessToken ? (
          <div className="clay-card rounded-xl p-6 space-y-4">
            <p className="text-on-surface-variant">Login to view your booking history.</p>
            <Link href={loginUrl}>
              <Button>Login</Button>
            </Link>
          </div>
        ) : null}

        {isLoading ? <p className="text-on-surface-variant">Loading bookings...</p> : null}
        {error ? <div className="clay-card rounded-xl p-4 bg-red-100/70 text-red-700">{error}</div> : null}
        {successMessage ? <div className="clay-card rounded-xl p-4 bg-emerald-100/70 text-emerald-700">{successMessage}</div> : null}

        {accessToken && !isLoading && !error ? (
          bookings.length ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="clay-card rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <h2 className="font-bold text-lg">{booking.show.movie.title}</h2>
                    <p className="text-sm text-on-surface-variant">
                      {booking.show.theater.name} • {booking.show.screen.name}
                    </p>
                    <p className="text-sm text-on-surface-variant">{formatDateTime(booking.show.startTime)}</p>
                    {booking.status === "CANCELLED" ? (
                      <p className="mt-2 text-sm font-semibold text-emerald-700">
                        Ticket cancelled successfully. Amount refunded successfully to your source account.
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div>
                      <p className="text-sm text-on-surface-variant">Status</p>
                      <p className="font-bold">{booking.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant">Amount</p>
                      <p className="font-bold">Rs. {booking.totalAmount}</p>
                    </div>
                    <Link href={`/bookings/${booking.id}`}>
                      <Button variant="secondary">
                        {booking.status === "CANCELLED" ? "View Cancellation" : "View Ticket"}
                      </Button>
                    </Link>
                    {isCancellationEligible(booking) ? (
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmBooking(booking)}
                        disabled={cancellingBookingId === booking.id}
                      >
                        {cancellingBookingId === booking.id ? "Cancelling..." : "Cancel Booking"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="clay-card rounded-xl p-8 text-center text-on-surface-variant">
              You have no bookings yet.
            </div>
          )
        ) : null}
      </main>

      <ConfirmDialog
        open={Boolean(confirmBooking)}
        title="Cancel this booking?"
        description={
          confirmBooking
            ? `${confirmBooking.show.movie.title} at ${confirmBooking.show.theater.name}. Your amount will be marked refunded and selected seats will be released instantly.`
            : ""
        }
        confirmLabel="Yes, cancel booking"
        cancelLabel="Keep booking"
        isLoading={Boolean(confirmBooking && cancellingBookingId === confirmBooking.id)}
        onCancel={() => setConfirmBooking(null)}
        onConfirm={() => {
          if (!confirmBooking) return;
          const bookingId = confirmBooking.id;
          setConfirmBooking(null);
          void handleCancelBooking(bookingId);
        }}
      />

      <Footer />
    </div>
  );
}
