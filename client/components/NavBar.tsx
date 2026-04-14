import React from "react";
import Link from "next/link";

export const NavBar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-surface/70 backdrop-blur-xl transition-all duration-300">
      <div className="flex justify-between items-center px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="text-2xl font-black text-primary italic font-headline tracking-tight">
          Book Suprabhat's Ticket
        </div>

        <div className="hidden md:flex items-center gap-10">
          <Link
            href="#"
            className="text-primary border-b-4 border-primary/20 rounded-b-lg font-headline font-bold tracking-tight hover:scale-105 transition-all duration-300"
          >
            Movies
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant font-medium font-headline tracking-tight hover:scale-105 hover:text-primary transition-all duration-300"
          >
            Cinemas
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant font-medium font-headline tracking-tight hover:scale-105 hover:text-primary transition-all duration-300"
          >
            Offers
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant font-medium font-headline tracking-tight hover:scale-105 hover:text-primary transition-all duration-300"
          >
            My Bookings
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 py-2 clay-inset">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">
              search
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 outline-none"
              placeholder="Search movies..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/register">
              <button className="hidden sm:block clay-button-secondary px-6 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                Sign Up
              </button>
            </Link>
            <Link 
              href="/login" 
              className="material-symbols-outlined text-on-surface text-3xl hover:scale-110 active:scale-90 transition-all cursor-pointer"
            >
              account_circle
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
