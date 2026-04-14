"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { SeatLayoutPreview, SeatItem } from "@/components/seat-layout-preview";
import { getAccessToken } from "@/lib/auth-storage";
import {
  fetchPublicShowSeatMap,
  lockShowSeats,
  PublicShowSeatMap,
  unlockShowSeats,
  UserApiError,
} from "@/lib/user-api";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ShowSeatsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showId = Number(params.id);

  const [show, setShow] = useState<PublicShowSeatMap | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [isUpdatingSeat, setIsUpdatingSeat] = useState(false);
  const selectedSeatIdsRef = useRef<number[]>([]);

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeatIds;
  }, [selectedSeatIds]);

  const loadSeatMap = async (withLoading = false) => {
    if (!Number.isFinite(showId) || showId <= 0) {
      setError("Invalid show selected.");
      setIsLoading(false);
      return;
    }

    const accessToken = getAccessToken();

    if (withLoading) {
      setIsLoading(true);
    }

    try {
      setError("");
      const data = await fetchPublicShowSeatMap(showId, accessToken);
      setShow(data);
      setSelectedSeatIds((prev) =>
        prev.filter((id) => {
          const seat = data.seats.find((candidate) => candidate.id === id);
          if (!seat) return false;
          if (seat.status === "BOOKED") return false;
          if (seat.status === "LOCKED" && !seat.isLockedByCurrentUser) return false;
          return true;
        }),
      );
    } catch (loadError) {
      if (
        loadError instanceof UserApiError &&
        loadError.message.toLowerCase().includes("show has already started")
      ) {
        router.replace(`/movies/${showId}`);
        return;
      }

      const message = loadError instanceof UserApiError ? loadError.message : "Unable to load seat map.";
      setError(message);
    } finally {
      if (withLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadSeatMap(true);
  }, [params.id]);

  useEffect(() => {
    if (!Number.isFinite(showId) || showId <= 0) return;

    const interval = setInterval(() => {
      void loadSeatMap(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [showId]);

  useEffect(() => {
    return () => {
      const accessToken = getAccessToken();
      if (!accessToken || !Number.isFinite(showId) || showId <= 0) return;

      const seatIdsToRelease = selectedSeatIdsRef.current;
      if (seatIdsToRelease.length === 0) return;

      void unlockShowSeats(accessToken, {
        showId,
        showSeatIds: seatIdsToRelease,
      });
    };
  }, [showId]);

  const selectedSeats = useMemo(() => {
    if (!show) return [];
    return show.seats.filter((seat) => selectedSeatIds.includes(seat.id));
  }, [show, selectedSeatIds]);

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);

  const onToggleSeat = async (seat: SeatItem) => {
    if (!show || isUpdatingSeat) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      const nextPath = `/shows/${show.id}/seats`;
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const isSelected = selectedSeatIds.includes(seat.id);
    const canToggleAvailable = seat.status === "AVAILABLE";
    const canToggleMyLock = seat.status === "LOCKED" && seat.isLockedByCurrentUser;

    if (!isSelected && !canToggleAvailable && !canToggleMyLock) {
      return;
    }

    try {
      setIsUpdatingSeat(true);
      setError("");

      if (isSelected) {
        await unlockShowSeats(accessToken, {
          showId: show.id,
          showSeatIds: [seat.id],
        });
        setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
      } else {
        await lockShowSeats(accessToken, {
          showId: show.id,
          showSeatIds: [seat.id],
        });
        setSelectedSeatIds((prev) => (prev.includes(seat.id) ? prev : [...prev, seat.id]));
      }

      await loadSeatMap(false);
    } catch (toggleError) {
      if (toggleError instanceof UserApiError && toggleError.statusCode === 401) {
        const nextPath = `/shows/${show.id}/seats`;
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      if (
        toggleError instanceof UserApiError &&
        toggleError.message.toLowerCase().includes("show has already started")
      ) {
        router.replace(`/movies/${show.movie.id}`);
        return;
      }

      const message =
        toggleError instanceof UserApiError
          ? toggleError.message
          : "Unable to update seat lock. Please try again.";
      setError(message);
      await loadSeatMap(false);
    } finally {
      setIsUpdatingSeat(false);
    }
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

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-10 space-y-6">
        {isLoading && <p className="text-on-surface-variant">Loading seat map…</p>}
        {error && (
          <div className="clay-card rounded-xl p-6 text-red-700 bg-red-100/70">{error}</div>
        )}

        {show && !isLoading && (
          <>
            {/* ── Show info header ── */}
            <section className="clay-card rounded-2xl p-6 md:p-8">
              <h1 className="text-3xl font-headline font-black">{show.movie.title}</h1>
              <p className="mt-1 text-on-surface-variant">
                {show.theater.name} &middot; {show.screen.name} &middot; {show.screen.screenType}
              </p>
              <p className="text-on-surface-variant">{formatDateTime(show.startTime)}</p>
            </section>

            {/* ── Seat map ── */}
            <section className="clay-card rounded-2xl p-6 md:p-8 space-y-8">
              <SeatLayoutPreview
                seats={show.seats}
                selectedIds={selectedSeatIds}
                onToggle={(seat) => {
                  void onToggleSeat(seat);
                }}
              />
            </section>

            {/* ── Selection summary + CTA ── */}
            <section className="clay-card rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky bottom-4 z-10 backdrop-blur-sm">
              <div className="space-y-0.5">
                <p className="text-xs text-on-surface-variant uppercase tracking-widest">
                  Selected seats
                </p>
                <p className="font-bold text-on-surface text-sm">
                  {selectedSeats.length > 0
                    ? selectedSeats
                        .map((s) => s.screenSeat.seatLabel)
                        .join(", ")
                    : "None — tap a seat to select"}
                </p>
                {selectedSeats.length > 0 && (
                  <p className="text-primary font-black text-lg">
                    Rs. {totalAmount.toLocaleString("en-IN")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/movies/${show.movie.id}`}>
                  <Button variant="secondary">Back</Button>
                </Link>
                <Button onClick={goToCheckout} disabled={selectedSeatIds.length === 0 || isUpdatingSeat}>
                  Continue to Checkout
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
