import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { fetchPublicMovieDetails, fetchPublicShows } from "@/lib/user-api";

type PageProps = {
  params: Promise<{
    id: string;
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

export default async function MovieDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const movieId = Number(resolvedParams.id);

  if (!Number.isFinite(movieId) || movieId <= 0) {
    notFound();
  }

  try {
    const [movie, shows] = await Promise.all([
      fetchPublicMovieDetails(movieId),
      fetchPublicShows({ movieId }),
    ]);

    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />

        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-6 md:px-8 py-10 md:py-12 space-y-10">
          <section className="grid md:grid-cols-[300px_1fr] gap-8 items-start">
            <div className="relative aspect-2/3 rounded-xl overflow-hidden clay-card">
              <Image
                src={movie.posterVerticalUrl || movie.posterHorizontalUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCGr8EXFBD_o391lFDenx_6yONfIuknjjEX7887uNiJCN4d91s45tkedDnWHycBjot6J1BvzxmQt3cedh9AdCYRq0n61thWT04wrW75_9cBcX3azf7QFdNGAuCpCOmcoSQuL0H1pguuNVlglqK-kQcaeaNn0DbyiCpL28y0J5oU-Rp934UcN9Hojpoe8NuJxTL7kWyUS5cQo201MBnqGXsdDv3coLRLgVYjFn4sAjxIn84nKYgHZJvD9a8IpRxZ9LLo18thg-tBToM"}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
              />
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold tracking-widest text-primary uppercase">Now Booking</p>
                <h1 className="text-4xl md:text-5xl font-headline font-black text-on-surface mt-2">{movie.title}</h1>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-4 py-2 rounded-full bg-surface-container-high">{movie.genre}</span>
                <span className="px-4 py-2 rounded-full bg-surface-container-high">{movie.language}</span>
                <span className="px-4 py-2 rounded-full bg-surface-container-high">
                  {formatDuration(movie.durationMinutes)}
                </span>
                <span className="px-4 py-2 rounded-full bg-surface-container-high">
                  Released {new Date(movie.releaseDate).toLocaleDateString()}
                </span>
              </div>

              <p className="text-on-surface-variant leading-relaxed max-w-3xl">{movie.description}</p>

              <Link href="#showtimes">
                <Button variant="primary">View Showtimes</Button>
              </Link>
            </div>
          </section>

          <section id="showtimes" className="space-y-5">
            <h2 className="text-3xl font-headline font-extrabold">Select Showtime</h2>

            {shows.length ? (
              <div className="grid gap-4">
                {shows.map((show) => (
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
                No upcoming showtimes found for this movie yet.
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
