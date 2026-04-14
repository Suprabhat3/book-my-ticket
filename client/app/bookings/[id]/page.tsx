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

  // Left content area: x=60 to x=840 (width=780), Right QR sidebar: x=876 to x=1140
  // 3 info columns so each has enough room:
  //   Col A (Theater+Screen):        x=60,  w=250  → clips at x=310
  //   Col B (Show Time+Seats):       x=334, w=220  → clips at x=554
  //   Col C (Status+Payment):        x=578, w=262  → clips at x=840

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="ticketBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#101828" />
      <stop offset="100%" stop-color="#1F2937" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>

    <!-- Movie title: left area only -->
    <clipPath id="titleClip">
      <rect x="60" y="155" width="780" height="85" />
    </clipPath>

    <!-- Col A: Theater + Screen -->
    <clipPath id="colAClip">
      <rect x="60" y="268" width="250" height="175" />
    </clipPath>

    <!-- Col B: Show Time + Seats -->
    <clipPath id="colBClip">
      <rect x="334" y="268" width="220" height="175" />
    </clipPath>

    <!-- Col C: Booking Status + Payment -->
    <clipPath id="colCClip">
      <rect x="578" y="268" width="262" height="175" />
    </clipPath>

    <!-- Footer left: Booking ID + Issued (stops before PAID) -->
    <clipPath id="footerClip">
      <rect x="60" y="458" width="650" height="90" />
    </clipPath>
  </defs>

  <!-- ── Ticket background ── -->
  <rect x="20" y="20" width="1160" height="560" rx="36" fill="url(#ticketBg)" />
  <rect x="20" y="20" width="1160" height="560" rx="36" fill="none" stroke="#374151" stroke-width="2" />

  <!-- Tear notches -->
  <circle cx="20"   cy="300" r="28" fill="#ffffff" />
  <circle cx="1180" cy="300" r="28" fill="#ffffff" />

  <!-- Perforated vertical divider (content | QR) -->
  <line x1="860" y1="48" x2="860" y2="552" stroke="#4B5563" stroke-dasharray="8 8" stroke-width="1.5" />

  <!-- ── Header banner ── -->
  <rect x="60" y="48" width="1080" height="84" rx="20" fill="url(#accent)" />
  <text x="92" y="102" fill="#1f2937" font-size="38" font-family="Arial, Helvetica, sans-serif" font-weight="700">Book Suprabhat's Ticket</text>
  <text x="1128" y="102" text-anchor="end" fill="#1f2937" font-size="24" font-family="Arial, Helvetica, sans-serif" font-weight="700">E-TICKET</text>

  <!-- ── Movie section ── -->
  <text x="60" y="170" fill="#9CA3AF" font-size="15" font-family="Arial, Helvetica, sans-serif" letter-spacing="4">MOVIE</text>
  <g clip-path="url(#titleClip)">
    <text x="60" y="222" fill="#F9FAFB" font-size="44" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(booking.show.movie.title)}</text>
  </g>

  <!-- Dashed separator below movie title -->
  <line x1="60" y1="252" x2="1140" y2="252" stroke="#4B5563" stroke-dasharray="10 10" stroke-width="1.5" />

  <!-- ── Info columns ── -->

  <!-- Col A: Theater + Screen -->
  <g clip-path="url(#colAClip)">
    <text x="60" y="290" fill="#9CA3AF" font-size="14" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">THEATER</text>
    <text x="60" y="322" fill="#F9FAFB" font-size="23" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(booking.show.theater.name)}</text>
    <text x="60" y="356" fill="#94A3B8" font-size="18" font-family="Arial, Helvetica, sans-serif">${escapeSvg(booking.show.screen.name)}</text>
  </g>

  <!-- Col B: Show Time (top) + Seats (bottom) -->
  <g clip-path="url(#colBClip)">
    <text x="334" y="290" fill="#9CA3AF" font-size="14" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">SHOW TIME</text>
    <text x="334" y="322" fill="#F9FAFB" font-size="23" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(showTime)}</text>
    <text x="334" y="370" fill="#9CA3AF" font-size="14" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">SEATS</text>
    <text x="334" y="402" fill="#FBBF24" font-size="23" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(seats)}</text>
  </g>

  <!-- Col C: Booking Status (top) + Payment (bottom) -->
  <g clip-path="url(#colCClip)">
    <text x="578" y="290" fill="#9CA3AF" font-size="14" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">BOOKING STATUS</text>
    <text x="578" y="322" fill="#F9FAFB" font-size="23" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(bookingStatus)}</text>
    <text x="578" y="370" fill="#9CA3AF" font-size="14" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">PAYMENT</text>
    <text x="578" y="402" fill="#34D399" font-size="23" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvg(paymentStatus)}</text>
  </g>

  <!-- ── QR sidebar ── -->
  <!-- White card centred in right sidebar; sidebar = x 876–1140 = 264 px wide -->
  <!-- Card: 220×220, centred → x = 876 + (264-220)/2 = 898 -->
  <rect x="898" y="152" width="220" height="220" rx="16" fill="#ffffff" />
  <image x="909" y="163" width="198" height="198" href="${escapeSvg(qrHref)}" />
  <text x="1008" y="394" text-anchor="middle" fill="#9CA3AF" font-size="15" font-family="Arial, Helvetica, sans-serif">Scan to verify</text>

  <!-- ── Footer ── -->
  <line x1="60" y1="450" x2="1140" y2="450" stroke="#4B5563" stroke-width="1.5" />

  <!-- Footer left: Booking ID + Issued At (clipped so they don't reach PAID) -->
  <g clip-path="url(#footerClip)">
    <text x="60" y="478" fill="#6B7280" font-size="16" font-family="Arial, Helvetica, sans-serif">Booking ID: ${escapeSvg(booking.id)}</text>
    <text x="60" y="504" fill="#9CA3AF" font-size="16" font-family="Arial, Helvetica, sans-serif">Issued: ${escapeSvg(issuedAt)}</text>
  </g>

  <!-- Footer right: PAID – anchored to right edge, vertically centred between separator and bottom -->
  <text x="1140" y="500" text-anchor="end" fill="#FBBF24" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="700">PAID: Rs. ${escapeSvg(String(booking.totalAmount))}</text>
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
