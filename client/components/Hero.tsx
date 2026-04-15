import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/Button";

type HeroMovie = {
  id: number;
  title: string;
  description: string;
  posterHorizontalUrl: string | null;
  posterVerticalUrl: string | null;
};

type HeroProps = {
  featuredMovie?: HeroMovie;
};

const fallbackMovie: HeroMovie = {
  id: 0,
  title: "Now Streaming Soon",
  description:
    "Fresh shows are being programmed. Check back shortly for the next big premiere.",
  posterHorizontalUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCx0O1ZqerpKVMrFxAbKKXpnJ_chXsFbGU5A34ufrK7P0VjyKH9SbGBc4I8mnrP53nrgvN5hBqCgvSWg38TZPaGKP8_Q4VY5n9LUxOvhU5-toKyBvXvKyCVulwG-SXzWthjZb9SKcf1YJSj2oiMf5ApkXsCosttqynIuXy9JK3RHul3-H1kckzvfLPBiWmTGbL1GSZ80TbD0auoh-WsP8PGEoIPRkovO3sIGvsJTGTLNQhpP3fOkLyzkV72Xcoc8Pn8YMbbQOK_jtE",
  posterVerticalUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBe2P23vYaEU3fx2ngToPo49f_XOmBH-jow3YTii7WWKSaRXfnNgn2A--bAq1lJ7-_6SNFxcJT_IGbGFxwjjVbcfmFjgmZY8rFSYM9mtDeEUSSM-ED-roAWJJVT2d1Vkj7fl6KGwSH-z-zCSUxTzkUEZO6MHQg0vWXJn9WjzW7tB18j7PW6y3SOmEKaxZyD2xiRAYl3JmxZU5IiUVA60QU54PoSbhkDRBiG7QJf9d3rnMTzBkXPndbtjNmQUJM-fO0Nserbzmwnl68",
};

export const Hero = ({ featuredMovie }: HeroProps) => {
  const movie = featuredMovie || fallbackMovie;

  return (
    <section className="relative mb-24 overflow-hidden rounded-xl h-180 bg-surface-container ring-1 ring-inset ring-white">
      <div className="absolute inset-0 z-10 bg-linear-to-r from-surface via-surface/40 to-transparent"></div>
      <Image
        alt={movie.title}
        src={
          movie.posterHorizontalUrl ||
          fallbackMovie.posterHorizontalUrl ||
          "/placeholder.png"
        }
        fill
        sizes="100vw"
        className="object-fill"
        priority
      />

      <div className="relative z-20 h-full flex flex-col justify-center px-12 max-w-2xl">
        <span className="text-primary font-bold tracking-widest text-sm mb-4 inline-block bg-primary/10 px-4 py-1 rounded-full w-fit">
          NOW SHOWING
        </span>
        <h1 className="text-7xl font-headline font-black text-on-surface leading-tight mb-6">
          {movie.title}
        </h1>
        <p className="text-lg text-on-surface-variant mb-10 leading-relaxed max-w-lg">
          {movie.description}
        </p>

        <div className="flex items-center gap-6">
          {movie.id ? (
            <Link href={`/movies/${movie.id}`}>
              <Button variant="primary">
                <span className="material-symbols-outlined">
                  confirmation_number
                </span>
                Book Now
              </Button>
            </Link>
          ) : (
            <Button variant="primary" disabled>
              <span className="material-symbols-outlined">
                confirmation_number
              </span>
              Bookings Open Soon
            </Button>
          )}
          <Link href="/bookings">
            <Button variant="secondary">
              <span className="material-symbols-outlined">movie</span>
              My Bookings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
