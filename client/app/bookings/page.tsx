"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { getAccessToken } from "@/lib/auth-storage";
import { BookingDetails, fetchMyBookings, UserApiError } from "@/lib/user-api";

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
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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
                      <Button variant="secondary">View Ticket</Button>
                    </Link>
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

      <Footer />
    </div>
  );
}
