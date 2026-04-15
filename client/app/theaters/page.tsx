import Link from "next/link";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import {
  fetchPublicCities,
  fetchPublicShows,
  fetchPublicTheaters,
  ShowSummary,
  TheaterSummary,
} from "@/lib/user-api";

type PageProps = {
  searchParams?: {
    cityId?: string;
    theaterId?: string;
  };
};

function formatTimeRange(startTime: string, endTime: string) {
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${new Date(startTime).toLocaleTimeString([], options)} - ${new Date(endTime).toLocaleTimeString([], options)}`;
}

function formatShowDate(startTime: string) {
  return new Date(startTime).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getShowsByTheater(shows: ShowSummary[]) {
  const grouped = new Map<number, ShowSummary[]>();

  for (const show of shows) {
    const existing = grouped.get(show.theater.id) || [];
    existing.push(show);
    grouped.set(show.theater.id, existing);
  }

  for (const [, theaterShows] of grouped) {
    theaterShows.sort(
      (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
    );
  }

  return grouped;
}

function getAvailableCities(theaters: TheaterSummary[]) {
  const cityMap = new Map<number, { id: number; name: string; state: string | null }>();

  for (const theater of theaters) {
    cityMap.set(theater.city.id, {
      id: theater.city.id,
      name: theater.city.name,
      state: theater.city.state,
    });
  }

  return Array.from(cityMap.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export default async function TheatersPage({ searchParams }: PageProps) {
  const selectedCityId = Number(searchParams?.cityId || "");
  const selectedTheaterId = Number(searchParams?.theaterId || "");
  const selectedCityFilter = Number.isFinite(selectedCityId) && selectedCityId > 0 ? selectedCityId : undefined;
  const selectedTheaterFilter =
    Number.isFinite(selectedTheaterId) && selectedTheaterId > 0 ? selectedTheaterId : undefined;

  let cities = [] as Awaited<ReturnType<typeof fetchPublicCities>>;
  let theaters = [] as Awaited<ReturnType<typeof fetchPublicTheaters>>;
  let shows = [] as Awaited<ReturnType<typeof fetchPublicShows>>;

  try {
    [cities, theaters, shows] = await Promise.all([
      fetchPublicCities(),
      fetchPublicTheaters(),
      fetchPublicShows({}),
    ]);
  } catch {
    cities = [];
    theaters = [];
    shows = [];
  }

  const showsByTheater = getShowsByTheater(shows);
  const theatersWithShows = theaters.filter((theater) => showsByTheater.has(theater.id));

  const availableCitiesFromShows = getAvailableCities(theatersWithShows);
  const availableCityIds = new Set(availableCitiesFromShows.map((city) => city.id));

  const normalizedSelectedCityId =
    selectedCityFilter && availableCityIds.has(selectedCityFilter) ? selectedCityFilter : undefined;

  const theatersByCity = normalizedSelectedCityId
    ? theatersWithShows.filter((theater) => theater.cityId === normalizedSelectedCityId)
    : theatersWithShows;

  const availableTheaterIds = new Set(theatersByCity.map((theater) => theater.id));
  const normalizedSelectedTheaterId =
    selectedTheaterFilter && availableTheaterIds.has(selectedTheaterFilter)
      ? selectedTheaterFilter
      : undefined;

  const filteredTheaters = normalizedSelectedTheaterId
    ? theatersByCity.filter((theater) => theater.id === normalizedSelectedTheaterId)
    : theatersByCity;

  const cityNameLookup = new Map(cities.map((city) => [city.id, city.name]));

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-6 md:px-8 py-10 md:py-12 space-y-8">
        <section className="clay-card rounded-2xl p-8 md:p-10 bg-surface-container-lowest space-y-4">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary">Our Theaters</p>
          <h1 className="text-4xl md:text-5xl font-headline font-black text-on-surface">
            Pick Your City, Then Pick Your Show
          </h1>
          <p className="max-w-3xl text-on-surface-variant leading-relaxed">
            Explore active theaters with available shows near you. Select a city to narrow results, then tap any
            showtime to jump directly into seat selection.
          </p>
        </section>

        <section className="clay-card rounded-2xl p-6 md:p-8 bg-surface-container-lowest">
          <form method="get" className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
            <label className="flex flex-col gap-2 w-full sm:max-w-xs">
              <span className="text-sm font-semibold text-on-surface">Filter by city</span>
              <select
                name="cityId"
                defaultValue={normalizedSelectedCityId ? String(normalizedSelectedCityId) : ""}
                className="rounded-xl px-4 py-3 bg-surface-container-low border border-surface-container-high outline-none"
              >
                <option value="">All Cities</option>
                {availableCitiesFromShows.map((city) => (
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
            <Button type="submit" className="justify-center sm:w-auto">
              Apply Filter
            </Button>
            <Link
              href="/theaters"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold transition-all duration-300 active:scale-95 hover:scale-105 clay-button-secondary text-on-secondary-container"
            >
              Clear
            </Link>
          </form>
        </section>

        {filteredTheaters.length ? (
          <section className="grid gap-5">
            {filteredTheaters.map((theater) => {
              const theaterShows = showsByTheater.get(theater.id) || [];
              const cityLabel = theater.city.state
                ? `${theater.city.name}, ${theater.city.state}`
                : cityNameLookup.get(theater.cityId) || theater.city.name;

              return (
                <article
                  key={theater.id}
                  className="clay-card rounded-2xl p-6 md:p-7 bg-surface-container-lowest space-y-5"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-headline font-extrabold text-on-surface">{theater.name}</h2>
                      <p className="text-on-surface-variant mt-1">{theater.addressLine}</p>
                      <p className="text-sm text-on-surface-variant mt-1">{cityLabel}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {theaterShows.map((show) => (
                      <Link
                        key={show.id}
                        href={`/shows/${show.id}/seats`}
                        className="rounded-xl px-4 py-4 bg-surface-container-low border border-surface-container-high hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      >
                        <p className="text-sm font-semibold text-primary">{formatShowDate(show.startTime)}</p>
                        <p className="font-bold text-on-surface mt-1">{formatTimeRange(show.startTime, show.endTime)}</p>
                        <p className="text-sm text-on-surface-variant mt-1 truncate">{show.movie.title}</p>
                        <p className="text-sm text-on-surface-variant">{show.screen.name}</p>
                        <p className="text-sm font-semibold text-on-surface mt-2">From Rs. {show.basePrice}</p>
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="clay-card rounded-2xl p-8 text-center text-on-surface-variant bg-surface-container-lowest">
            {normalizedSelectedCityId
              ? "No theaters with active shows found for the selected filters yet."
              : "No theater shows are available right now. Please check back shortly."}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
