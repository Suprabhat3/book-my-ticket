import { NavBar } from "@/components/NavBar";
import { Hero } from "@/components/Hero";
import { MovieCard } from "@/components/MovieCard";
import { ExperiencePromo } from "@/components/ExperiencePromo";
import { Footer } from "@/components/Footer";
import { fetchPublicMovies } from "@/lib/user-api";

function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default async function Home() {
  const movies = await fetchPublicMovies();
  const featuredMovie = movies.length
    ? movies[Math.floor(Math.random() * movies.length)]
    : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-8 py-12">
        <Hero
          featuredMovie={
            featuredMovie
              ? {
                  id: featuredMovie.id,
                  title: featuredMovie.title,
                  description: featuredMovie.description,
                  posterHorizontalUrl: featuredMovie.posterHorizontalUrl,
                  posterVerticalUrl: featuredMovie.posterVerticalUrl,
                }
              : undefined
          }
        />
        
        <section className="mb-24">
          <h2 className="text-3xl font-headline font-extrabold mb-8 flex items-center gap-4">
            <span className="w-12 h-1 bg-primary rounded-full"></span>
            Trending Now
          </h2>
          {movies.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  genre={movie.genre}
                  duration={formatDuration(movie.durationMinutes)}
                  language={movie.language}
                  image={movie.posterVerticalUrl || movie.posterHorizontalUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCGr8EXFBD_o391lFDenx_6yONfIuknjjEX7887uNiJCN4d91s45tkedDnWHycBjot6J1BvzxmQt3cedh9AdCYRq0n61thWT04wrW75_9cBcX3azf7QFdNGAuCpCOmcoSQuL0H1pguuNVlglqK-kQcaeaNn0DbyiCpL28y0J5oU-Rp934UcN9Hojpoe8NuJxTL7kWyUS5cQo201MBnqGXsdDv3coLRLgVYjFn4sAjxIn84nKYgHZJvD9a8IpRxZ9LLo18thg-tBToM"}
                />
              ))}
            </div>
          ) : (
            <div className="clay-card rounded-xl p-10 text-center text-on-surface-variant">
              Movies are being updated. Please check again in a few minutes.
            </div>
          )}
        </section>

        <ExperiencePromo />
      </main>

      <Footer />
    </div>
  );
}

