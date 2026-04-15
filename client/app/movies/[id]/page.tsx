import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { fetchPublicMovieDetails, fetchPublicShows, fetchPublicTheaters } from "@/lib/user-api";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    cityId?: string;
    theaterId?: string;
  }>;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(durationMinutes: number) {
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  return `${h}h ${m}m`;
}

export default async function MovieDetailsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const movieId = Number(resolvedParams.id);
  const selectedCityId = Number(resolvedSearchParams?.cityId || "");
  const selectedTheaterId = Number(resolvedSearchParams?.theaterId || "");

  const selectedCityFilter = Number.isFinite(selectedCityId) && selectedCityId > 0 ? selectedCityId : undefined;
  const selectedTheaterFilter =
    Number.isFinite(selectedTheaterId) && selectedTheaterId > 0 ? selectedTheaterId : undefined;

  if (!Number.isFinite(movieId) || movieId <= 0) {
    notFound();
  }

  try {
    const [movie, shows, theaters] = await Promise.all([
      fetchPublicMovieDetails(movieId),
      fetchPublicShows({ movieId }),
      fetchPublicTheaters(),
    ]);

    const availableTheaterIds = new Set(shows.map((show) => show.theater.id));
    const availableTheaters = theaters
      .filter((theater) => availableTheaterIds.has(theater.id))
      .sort((left, right) => left.name.localeCompare(right.name));

    const availableCitiesMap = new Map<number, { id: number; name: string; state: string | null }>();
    for (const theater of availableTheaters) {
      availableCitiesMap.set(theater.city.id, {
        id: theater.city.id,
        name: theater.city.name,
        state: theater.city.state,
      });
    }

    const availableCities = Array.from(availableCitiesMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    const availableCityIds = new Set(availableCities.map((city) => city.id));
    const normalizedSelectedCityId =
      selectedCityFilter && availableCityIds.has(selectedCityFilter) ? selectedCityFilter : undefined;

    const theatersByCity = normalizedSelectedCityId
      ? availableTheaters.filter((theater) => theater.cityId === normalizedSelectedCityId)
      : availableTheaters;

    const availableTheaterIdsByCity = new Set(theatersByCity.map((theater) => theater.id));
    const normalizedSelectedTheaterId =
      selectedTheaterFilter && availableTheaterIdsByCity.has(selectedTheaterFilter)
        ? selectedTheaterFilter
        : undefined;

    const filteredShows = shows.filter((show) => {
      if (normalizedSelectedCityId && show.theater.cityId !== normalizedSelectedCityId) {
        return false;
      }
      if (normalizedSelectedTheaterId && show.theater.id !== normalizedSelectedTheaterId) {
        return false;
      }
      return true;
    });

    return (
      <div className="relative min-h-screen flex flex-col">

        {/* ── Full-page horizontal backdrop ── */}
        {movie.posterHorizontalUrl && (
          <div className="absolute inset-x-0 top-0 h-[75vh] z-0 pointer-events-none select-none" aria-hidden="true">
            <Image
              src={movie.posterHorizontalUrl}
              alt=""
              fill
              priority
              className="object-cover object-top"
              sizes="100vw"
            />
            {/* Darken so text stays legible */}
            <div className="absolute inset-0 bg-surface/55" />
            {/* Fade to surface at the bottom — bleeds into page content */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/60 to-surface" />
            {/* Subtle side vignettes */}
            <div className="absolute inset-0 bg-gradient-to-r from-surface/40 via-transparent to-surface/40" />
          </div>
        )}

        <NavBar />

        <main className="relative z-10 flex-1 w-full max-w-screen-2xl mx-auto px-6 md:px-8 py-10 md:py-12 space-y-10">
          {/* ── Hero Section — floats over the backdrop ── */}
          <section className="grid md:grid-cols-[260px_1fr] gap-8 md:gap-12 items-start pt-4">

              {/* Vertical poster */}
              <div className="relative aspect-2/3 rounded-2xl overflow-hidden clay-card shrink-0 w-[200px] md:w-full">
                <Image
                  src={movie.posterVerticalUrl || movie.posterHorizontalUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCGr8EXFBD_o391lFDenx_6yONfIuknjjEX7887uNiJCN4d91s45tkedDnWHycBjot6J1BvzxmQt3cedh9AdCYRq0n61thWT04wrW75_9cBcX3azf7QFdNGAuCpCOmcoSQuL0H1pguuNVlglqK-kQcaeaNn0DbyiCpL28y0J5oU-Rp934UcN9Hojpoe8NuJxTL7kWyUS5cQo201MBnqGXsdDv3coLRLgVYjFn4sAjxIn84nKYgHZJvD9a8IpRxZ9LLo18thg-tBToM"}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 200px, 300px"
                  priority
                />
              </div>

              {/* Text info */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold tracking-widest text-primary uppercase">Now Booking</p>
                  <h1 className="text-4xl md:text-5xl font-headline font-black text-on-surface mt-2 drop-shadow-sm">
                    {movie.title}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3 text-sm">
                  {[
                    movie.genre,
                    movie.language,
                    formatDuration(movie.durationMinutes),
                    `Released ${new Date(movie.releaseDate).toLocaleDateString()}`,
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="px-4 py-2 rounded-full bg-surface-container/70 backdrop-blur-md font-body font-medium"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <p className="text-on-surface-variant leading-relaxed max-w-xl font-body">
                  {movie.description}
                </p>

                <Link href="#showtimes">
                  <Button variant="primary">View Showtimes</Button>
                </Link>
              </div>
          </section>

          <section id="showtimes" className="space-y-5">
            <h2 className="text-3xl font-headline font-extrabold">Select Showtime</h2>

            <div className="clay-card rounded-xl p-5 md:p-6 bg-surface-container-lowest">
              <form method="get" className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
                <label className="flex flex-col gap-2 w-full">
                  <span className="text-sm font-semibold text-on-surface">Filter by city</span>
                  <select
                    name="cityId"
                    defaultValue={normalizedSelectedCityId ? String(normalizedSelectedCityId) : ""}
                    className="rounded-xl px-4 py-3 bg-surface-container-low border border-surface-container-high outline-none"
                  >
                    <option value="">All Cities</option>
                    {availableCities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.state ? `${city.name}, ${city.state}` : city.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 w-full">
                  <span className="text-sm font-semibold text-on-surface">Filter by theater</span>
                  <select
                    name="theaterId"
                    defaultValue={normalizedSelectedTheaterId ? String(normalizedSelectedTheaterId) : ""}
                    className="rounded-xl px-4 py-3 bg-surface-container-low border border-surface-container-high outline-none"
                  >
                    <option value="">All Theaters</option>
                    {theatersByCity.map((theater) => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name}
                      </option>
                    ))}
                  </select>
                </label>

                <Button type="submit" className="justify-center">
                  Apply Filter
                </Button>

                <Link
                  href={`/movies/${movie.id}#showtimes`}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold transition-all duration-300 active:scale-95 hover:scale-105 clay-button-secondary text-on-secondary-container"
                >
                  Clear
                </Link>
              </form>
            </div>

            {filteredShows.length ? (
              <div className="grid gap-4">
                {filteredShows.map((show) => (
                  <div
                    key={show.id}
                    className="clay-card bg-surface-container-lowest rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-lg text-on-surface">{show.theater.name}</p>
                      <p className="text-on-surface-variant text-sm">{show.theater.addressLine}</p>
                      <p className="text-on-surface-variant text-sm">
                        {show.screen.name} • {show.screen.screenType}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <div className="text-sm">
                        <p className="font-semibold">{formatDate(show.startTime)}</p>
                        <p className="text-on-surface-variant">
                          {formatTime(show.startTime)} - {formatTime(show.endTime)}
                        </p>
                      </div>

                      <p className="text-primary font-bold">From Rs. {show.basePrice}</p>

                      <Link href={`/shows/${show.id}/seats`}>
                        <Button className="justify-center">Choose Seats</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="clay-card rounded-xl p-8 text-center text-on-surface-variant">
                No showtimes found for the selected city and theater filters.
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    );
  } catch {
    notFound();
  }
}
