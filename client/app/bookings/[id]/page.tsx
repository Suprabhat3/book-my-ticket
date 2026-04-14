"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { getAccessToken } from "@/lib/auth-storage";
import { BookingDetails, fetchBookingDetails, UserApiError } from "@/lib/user-api";

const TICKET_QR_TARGET_URL = "https://suprabhat.site/";

function getQrImageUrl(size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&qzone=1&data=${encodeURIComponent(TICKET_QR_TARGET_URL)}`;
}

async function getQrDataUrl(size = 220) {
  const response = await fetch(getQrImageUrl(size));
  if (!response.ok) {
    throw new Error("Failed to fetch QR image");
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Invalid QR data URL"));
    };
    reader.onerror = () => reject(new Error("Unable to read QR image"));
    reader.readAsDataURL(blob);
  });
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

function escapeSvg(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildTicketSvg(booking: BookingDetails, qrHref: string) {
  const seats = booking.seats.map((seat) => seat.showSeat.screenSeat.seatLabel).join(", ");
  const issuedAt = new Date(booking.createdAt).toLocaleString();
  const showTime = formatDateTime(booking.show.startTime);
  const bookingStatus = booking.status;
  const paymentStatus = booking.payment?.status || "N/A";
  const qrUrl = qrHref;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640" viewBox="0 0 1200 640">
  <defs>
    <linearGradient id="ticketBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#101828" />
      <stop offset="100%" stop-color="#1F2937" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>
  </defs>

  <rect x="20" y="20" width="1160" height="600" rx="36" fill="url(#ticketBg)" />
  <rect x="20" y="20" width="1160" height="600" rx="36" fill="none" stroke="#374151" stroke-width="2" />

  <circle cx="20" cy="320" r="28" fill="#ffffff"/>
  <circle cx="1180" cy="320" r="28" fill="#ffffff"/>

  <rect x="60" y="60" width="1080" height="88" rx="20" fill="url(#accent)"/>
  <text x="95" y="114" fill="#1f2937" font-size="40" font-family="Arial, Helvetica, sans-serif" font-weight="700">BOOK Suprabhat's Ticket</text>
  <text x="940" y="114" fill="#1f2937" font-size="26" font-family="Arial, Helvetica, sans-serif" font-weight="700">E-TICKET</text>

  <text x="80" y="220" fill="#D1D5DB" font-size="24" font-family="Arial, Helvetica, sans-serif">MOVIE</text>
  <text x="80" y="266" fill="#F9FAFB" font-size="46" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(booking.show.movie.title)}</text>

  <line x1="80" y1="318" x2="1120" y2="318" stroke="#4B5563" stroke-dasharray="10 10" />

  <text x="80" y="380" fill="#9CA3AF" font-size="22" font-family="Arial, Helvetica, sans-serif">THEATER</text>
  <text x="80" y="414" fill="#F9FAFB" font-size="30" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(booking.show.theater.name)}</text>

  <text x="80" y="456" fill="#9CA3AF" font-size="22" font-family="Arial, Helvetica, sans-serif">SCREEN</text>
  <text x="80" y="490" fill="#F9FAFB" font-size="28" font-family="Arial, Helvetica, sans-serif">${escapeSvg(booking.show.screen.name)}</text>

  <text x="520" y="380" fill="#9CA3AF" font-size="22" font-family="Arial, Helvetica, sans-serif">SHOW TIME</text>
  <text x="520" y="414" fill="#F9FAFB" font-size="28" font-family="Arial, Helvetica, sans-serif">${escapeSvg(showTime)}</text>

  <text x="520" y="456" fill="#9CA3AF" font-size="22" font-family="Arial, Helvetica, sans-serif">SEATS</text>
  <text x="520" y="490" fill="#F9FAFB" font-size="28" font-family="Arial, Helvetica, sans-serif">${escapeSvg(seats)}</text>

  <text x="760" y="380" fill="#9CA3AF" font-size="22" font-family="Arial, Helvetica, sans-serif">BOOKING STATUS</text>
  <text x="760" y="414" fill="#F9FAFB" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(bookingStatus)}</text>

  <text x="760" y="456" fill="#9CA3AF" font-size="22" font-family="Arial, Helvetica, sans-serif">PAYMENT</text>
  <text x="760" y="490" fill="#34D399" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(paymentStatus)}</text>

  <rect x="932" y="188" width="176" height="176" rx="16" fill="#ffffff" />
  <image x="940" y="196" width="160" height="160" href="${escapeSvg(qrUrl)}" />

  <line x1="80" y1="530" x2="1120" y2="530" stroke="#4B5563" />

  <text x="80" y="575" fill="#9CA3AF" font-size="22" font-family="Arial, Helvetica, sans-serif">ISSUED AT ${escapeSvg(issuedAt)}</text>
  <text x="850" y="575" fill="#FBBF24" font-size="40" font-family="Arial, Helvetica, sans-serif" font-weight="700">PAID: Rs. ${escapeSvg(String(booking.totalAmount))}</text>
</svg>`;
}

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    setAccessToken(getAccessToken());
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    const bookingId = params.id;
    if (!bookingId) {
      setError("Invalid booking id.");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const data = await fetchBookingDetails(accessToken, bookingId);
        setBooking(data);
      } catch (loadError) {
        const message =
          loadError instanceof UserApiError ? loadError.message : "Unable to load booking details.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [accessToken, params.id]);

  const handleDownloadTicket = async () => {
    if (!booking) return;

    let qrHref = getQrImageUrl(160);
    try {
      qrHref = await getQrDataUrl(160);
    } catch {
      // Fallback to external URL when data embedding is unavailable.
    }

    const svgMarkup = buildTicketSvg(booking, qrHref);
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      image.decoding = "async";
      image.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Unable to load ticket image"));
        image.src = svgUrl;
      });

      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to create image context");
      }

      context.scale(scale, scale);
      context.drawImage(image, 0, 0);

      const pngUrl = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = pngUrl;
      anchor.download = `ticket-${booking.id}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      const anchor = document.createElement("a");
      anchor.href = svgUrl;
      anchor.download = `ticket-${booking.id}.svg`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  const seatLabels = booking?.seats.map((seat) => seat.showSeat.screenSeat.seatLabel).join(", ") || "";

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-headline font-black">Booking Details</h1>
          <div className="flex items-center gap-3">
            {booking ? (
              <Button onClick={handleDownloadTicket}>
                <span className="material-symbols-outlined">download</span>
                Download Ticket
              </Button>
            ) : null}
            <Link href="/bookings">
              <Button variant="secondary">Back to Bookings</Button>
            </Link>
          </div>
        </div>

        {isLoading ? <p className="text-on-surface-variant">Loading booking details...</p> : null}
        {error ? <div className="clay-card rounded-xl p-4 bg-red-100/70 text-red-700">{error}</div> : null}
        {!accessToken && !isLoading ? (
          <div className="clay-card rounded-xl p-6 space-y-3">
            <p className="text-on-surface-variant">Login to view this booking.</p>
            <Link href={`/login?next=${encodeURIComponent(`/bookings/${params.id}`)}`}>
              <Button>Login</Button>
            </Link>
          </div>
        ) : null}

        {booking ? (
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-slate-100 shadow-2xl">
            <div className="absolute -left-5 top-1/2 w-10 h-10 rounded-full bg-surface -translate-y-1/2" />
            <div className="absolute -right-5 top-1/2 w-10 h-10 rounded-full bg-surface -translate-y-1/2" />

            <div className="bg-linear-to-r from-amber-400 to-yellow-300 px-6 md:px-8 py-4 flex items-center justify-between">
              <p className="font-headline text-xl md:text-2xl font-black text-slate-900">Book Suprabhat's Ticket</p>
              <p className="text-slate-900 font-bold tracking-wide">E-TICKET</p>
            </div>

            <div className="p-5 md:p-7 space-y-4">
              <div>
                <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Movie</p>
                <h2 className="mt-2 text-3xl md:text-4xl font-headline font-black">{booking.show.movie.title}</h2>
              </div>

              <div className="border-t border-dashed border-slate-600" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Theater</p>
                  <p className="mt-2 text-lg font-semibold">{booking.show.theater.name}</p>
                  <p className="text-sm text-slate-400 mt-1">{booking.show.theater.addressLine}</p>
                </div>

                <div>
                  <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Showtime</p>
                  <p className="mt-2 text-lg font-semibold">{formatDateTime(booking.show.startTime)}</p>
                </div>

                <div>
                  <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Screen</p>
                  <p className="mt-2 text-lg font-semibold">{booking.show.screen.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[repeat(3,minmax(0,1fr))_190px] gap-5 items-center">
                <div>
                  <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Seats</p>
                  <p className="mt-2 text-lg font-semibold text-amber-300">{seatLabels}</p>
                </div>

                <div>
                  <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Booking Status</p>
                  <p className="mt-2 text-lg font-semibold">{booking.status}</p>
                </div>

                <div>
                  <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Payment</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-400">{booking.payment?.status || "N/A"}</p>
                </div>

                <a
                  href={TICKET_QR_TARGET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="justify-self-center md:justify-self-end bg-white rounded-2xl p-2 w-fit shadow-lg ring-1 ring-slate-300/60"
                  aria-label="Open QR redirect link"
                >
                  <img
                    src={getQrImageUrl(148)}
                    alt="Ticket QR code"
                    width={148}
                    height={148}
                    className="rounded-lg block"
                    loading="lazy"
                  />
                </a>
              </div>

              <div className="border-t border-dashed border-slate-600 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p className="text-xs text-slate-400">Booking ID: {booking.id}</p>
                <div className="flex items-center gap-6">
                  <p className="text-xs text-slate-400">Issued: {formatDateTime(booking.createdAt)}</p>
                  <p className="text-lg font-black text-amber-300">PAID: Rs. {booking.totalAmount}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
