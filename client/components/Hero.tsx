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
    <section className="relative isolate mb-12 md:mb-24 h-150 md:h-180 overflow-hidden rounded-xl bg-surface-container ring-1 ring-inset ring-white">
      <div className="absolute inset-0 z-10 bg-linear-to-t from-surface via-surface/80 to-transparent md:bg-linear-to-r md:from-surface md:via-surface/50 md:via-35% md:to-transparent"></div>
      
      {/* Desktop Image */}
      <Image
        alt={movie.title}
        src={
          movie.posterHorizontalUrl ||
          fallbackMovie.posterHorizontalUrl ||
          "/placeholder.png"
        }
        fill
        sizes="100vw"
        className="hidden md:block object-cover mask-[linear-gradient(to_right,transparent_0%,black_18%,black_100%)]"
        priority
      />

      {/* Mobile Image */}
      <Image
        alt={movie.title}
        src={
          movie.posterVerticalUrl ||
          fallbackMovie.posterVerticalUrl ||
          "/placeholder.png"
        }
        fill
        sizes="100vw"
        className="block md:hidden object-cover mask-[linear-gradient(to_top,transparent_0%,black_20%,black_100%)] object-top"
        priority
      />

      <div className="relative z-20 h-full flex flex-col justify-end md:justify-center px-6 pb-12 md:px-12 md:pb-0 max-w-2xl">
        <span className="text-primary font-bold tracking-widest text-xs md:text-sm mb-4 inline-block bg-primary/10 px-4 py-1 rounded-full w-fit">
          NOW SHOWING
        </span>
        <h1 className="text-5xl md:text-7xl font-headline font-black text-gray-800 leading-tight mb-4 md:mb-6">
          {movie.title}
        </h1>
        <p className="text-base md:text-lg text-gray-700 mb-8 md:mb-10 leading-relaxed max-w-lg">
          {movie.description}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-6">
          {movie.id ? (
            <Link href={`/movies/${movie.id}`} className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto justify-center">
                <span className="material-symbols-outlined">
                  confirmation_number
                </span>
                Book Now
              </Button>
            </Link>
          ) : (
            <Button variant="primary" disabled className="w-full sm:w-auto justify-center">
              <span className="material-symbols-outlined">
                confirmation_number
              </span>
              Bookings Open Soon
            </Button>
          )}
          <Link href="/bookings" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto justify-center">
              <span className="material-symbols-outlined">movie</span>
              My Bookings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
