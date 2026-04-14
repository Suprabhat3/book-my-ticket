import React from "react";
import Image from "next/image";
import { Button } from "./ui/Button";

interface MovieCardProps {
  title: string;
  genre: string;
  duration: string;
  rating: string;
  image: string;
}

export const MovieCard = ({ title, genre, duration, rating, image }: MovieCardProps) => {
  return (
    <div className="clay-card bg-surface-container-lowest p-5 rounded-lg group transition-all duration-500 hover:-translate-y-2">
      <div className="clay-inset rounded-lg overflow-hidden mb-6 aspect-[2/3] relative">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-headline font-bold text-on-surface">{title}</h3>
        <div className="flex items-center text-secondary font-bold">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="ml-1">{rating}</span>
        </div>
      </div>
      <p className="text-sm text-on-surface-variant mb-6">{genre} • {duration}</p>
      <Button className="w-full py-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
        Get Tickets
      </Button>
    </div>
  );
};
