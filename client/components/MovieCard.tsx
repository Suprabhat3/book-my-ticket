import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/Button";

interface MovieCardProps {
  id: number;
  title: string;
  genre: string;
  duration: string;
  language?: string;
  rating?: string;
  image: string;
}

export const MovieCard = ({ id, title, genre, duration, language, rating = "New", image }: MovieCardProps) => {
  return (
    <div className="clay-card bg-surface-container-lowest p-4 sm:p-5 rounded-lg group transition-all duration-500 hover:-translate-y-2">
      <div className="clay-inset rounded-lg overflow-hidden mb-4 sm:mb-6 aspect-2/3 relative">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className="text-lg sm:text-xl font-headline font-bold text-on-surface line-clamp-1">{title}</h3>
        <div className="flex items-center text-secondary font-bold shrink-0">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="ml-1 text-sm sm:text-base">{rating}</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-on-surface-variant mb-4 sm:mb-6 line-clamp-1">{genre} • {duration}{language ? ` • ${language}` : ""}</p>
      <Link href={`/movies/${id}`}>
        <Button className="w-full justify-center py-2 sm:py-3 text-sm sm:text-base opacity-100 sm:opacity-0 group-hover:opacity-100 translate-y-0 sm:translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          Get Tickets
        </Button>
      </Link>
    </div>
  );
};
