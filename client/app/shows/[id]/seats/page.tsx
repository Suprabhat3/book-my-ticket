"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { fetchPublicShowSeatMap, PublicShowSeatMap, ShowSeatRecord, UserApiError } from "@/lib/user-api";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function seatBadgeClass(status: string, selected: boolean) {
  if (status === "BOOKED") return "bg-red-200 text-red-800 cursor-not-allowed";
  if (status === "LOCKED") return "bg-amber-200 text-amber-800 cursor-not-allowed";
  if (selected) return "bg-primary text-on-primary";
  return "bg-surface-container-high text-on-surface hover:bg-surface-container-highest";
}

export default function ShowSeatsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [show, setShow] = useState<PublicShowSeatMap | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);

  useEffect(() => {
    const showId = Number(params.id);

    if (!Number.isFinite(showId) || showId <= 0) {
      setError("Invalid show selected.");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const data = await fetchPublicShowSeatMap(showId);
        setShow(data);
      } catch (loadError) {
        const message =
          loadError instanceof UserApiError ? loadError.message : "Unable to load seat map.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [params.id]);

  const groupedSeats = useMemo(() => {
    const groups: Record<string, ShowSeatRecord[]> = {};
    if (!show) return groups;

    for (const seat of show.seats) {
      const key = seat.screenSeat.rowLabel;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(seat);
    }

    return groups;
  }, [show]);

  const selectedSeats = useMemo(() => {
    if (!show) return [];
    return show.seats.filter((seat) => selectedSeatIds.includes(seat.id));
  }, [show, selectedSeatIds]);

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);

  const onToggleSeat = (seat: ShowSeatRecord) => {
    if (seat.status !== "AVAILABLE") return;

    setSelectedSeatIds((previous) => {
      if (previous.includes(seat.id)) {
        return previous.filter((id) => id !== seat.id);
      }

      return [...previous, seat.id];
    });
  };

  const goToCheckout = () => {
    if (!show || selectedSeatIds.length === 0) return;
    const query = new URLSearchParams({
      showId: String(show.id),
      seatIds: selectedSeatIds.join(","),
    });
    router.push(`/checkout?${query.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-6 md:px-8 py-10 space-y-8">
        {isLoading ? <p className="text-on-surface-variant">Loading seat map...</p> : null}
        {error ? (
          <div className="clay-card rounded-xl p-6 text-red-700 bg-red-100/70">{error}</div>
        ) : null}

        {show && !isLoading ? (
          <>
            <section className="clay-card rounded-xl p-6 md:p-8 space-y-3">
              <h1 className="text-3xl font-headline font-black">{show.movie.title}</h1>
              <p className="text-on-surface-variant">
                {show.theater.name} • {show.screen.name} • {show.screen.screenType}
              </p>
              <p className="text-on-surface-variant">{formatDateTime(show.startTime)}</p>
            </section>

            <section className="clay-card rounded-xl p-6 md:p-8 space-y-5">
              <div className="text-center">
                <div className="mx-auto max-w-lg rounded-full h-3 bg-surface-container-high" />
                <p className="mt-3 text-sm text-on-surface-variant tracking-widest uppercase">Screen</p>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-175 space-y-2">
                  {Object.entries(groupedSeats).map(([rowLabel, seats]) => (
                    <div key={rowLabel} className="grid grid-cols-[40px_1fr] gap-3 items-center">
                      <p className="text-sm font-semibold text-on-surface-variant">{rowLabel}</p>
                      <div className="flex flex-wrap gap-2">
                        {seats.map((seat) => {
                          const selected = selectedSeatIds.includes(seat.id);
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              onClick={() => onToggleSeat(seat)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${seatBadgeClass(seat.status, selected)}`}
                              disabled={seat.status !== "AVAILABLE"}
                              title={`${seat.screenSeat.seatLabel} (${seat.screenSeat.seatType}) - Rs. ${seat.price}`}
                            >
                              {seat.screenSeat.seatLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                <span className="px-3 py-2 rounded-lg bg-surface-container-high">Available</span>
                <span className="px-3 py-2 rounded-lg bg-primary text-on-primary">Selected</span>
                <span className="px-3 py-2 rounded-lg bg-amber-200 text-amber-800">Locked</span>
                <span className="px-3 py-2 rounded-lg bg-red-200 text-red-800">Booked</span>
              </div>
            </section>

            <section className="clay-card rounded-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-on-surface-variant">Selected Seats</p>
                <p className="font-bold text-on-surface">
                  {selectedSeats.length
                    ? selectedSeats.map((seat) => seat.screenSeat.seatLabel).join(", ")
                    : "None"}
                </p>
                <p className="text-primary font-bold mt-1">Total: Rs. {totalAmount.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/movies/${show.movie.id}`}>
                  <Button variant="secondary">Back</Button>
                </Link>
                <Button onClick={goToCheckout} disabled={selectedSeatIds.length === 0}>
                  Continue to Checkout
                </Button>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
