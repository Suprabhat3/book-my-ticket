"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";
import { clearAuthSession, getAccessToken, getStoredUser } from "@/lib/auth-storage";
import { fetchPublicMovies, type MovieSummary } from "@/lib/user-api";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

const DEBOUNCE_MS = 300;
const FALLBACK_POSTER = "https://lh3.googleusercontent.com/aida-public/AB6AXuCGr8EXFBD_o391lFDenx_6yONfIuknjjEX7887uNiJCN4d91s45tkedDnWHycBjot6J1BvzxmQt3cedh9AdCYRq0n61thWT04wrW75_9cBcX3azf7QFdNGAuCpCOmcoSQuL0H1pguuNVlglqK-kQcaeaNn0DbyiCpL28y0J5oU-Rp934UcN9Hojpoe8NuJxTL7kWyUS5cQo201MBnqGXsdDv3coLRLgVYjFn4sAjxIn84nKYgHZJvD9a8IpRxZ9LLo18thg-tBToM";

export const NavBar = () => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Close search on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setResults([]);
      setIsSearchOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsSearchOpen(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const movies = await fetchPublicMovies(value.trim());
        setResults(movies);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const handleResultClick = () => {
    setIsSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const token = getAccessToken();
      if (token) {
        await logoutUser(token);
      }
    } catch {
      // Even if API logout fails, clear local session to keep UX clean.
    } finally {
      clearAuthSession();
      setUser(null);
      setIsLoggingOut(false);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-surface/70 backdrop-blur-xl transition-all duration-300 border-b border-white/5">
      <div className="flex justify-between items-center px-4 md:px-8 py-3 md:py-4 max-w-screen-2xl mx-auto gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 -ml-2 text-on-surface hover:text-primary transition-colors flex items-center justify-center rounded-full active:bg-white/10"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
          <Link href="/" className="text-base sm:text-2xl font-black text-primary italic font-headline tracking-tight truncate p-2">
            Book Suprabhat&apos;s Ticket
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <Link
            href="/"
            className="text-primary border-b-4 border-primary/20 rounded-b-lg font-headline font-bold tracking-tight hover:scale-105 transition-all duration-300"
          >
            Movies
          </Link>
          <Link
            href="/theaters"
            className="text-on-surface-variant font-medium font-headline tracking-tight hover:scale-105 hover:text-primary transition-all duration-300"
          >
            Cinemas
          </Link>
          <Link
            href="/"
            className="text-on-surface-variant font-medium font-headline tracking-tight hover:scale-105 hover:text-primary transition-all duration-300"
          >
            Offers
          </Link>
          <Link
            href="/bookings"
            className="text-on-surface-variant font-medium font-headline tracking-tight hover:scale-105 hover:text-primary transition-all duration-300"
          >
            My Bookings
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {/* Search */}
          <div ref={searchContainerRef} className="relative hidden lg:block">
            <div className="flex items-center bg-surface-container-low rounded-full px-4 py-2 clay-inset">
              {isSearching ? (
                <span className="material-symbols-outlined text-primary mr-2 animate-spin text-lg">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant mr-2">
                  search
                </span>
              )}
              <input
                id="navbar-search"
                className="bg-transparent border-none focus:ring-0 text-sm w-48 outline-none text-on-surface placeholder:text-on-surface-variant"
                placeholder="Search movies..."
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); setIsSearchOpen(false); }}
                  className="ml-1 text-on-surface-variant hover:text-primary transition-colors"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 rounded-3xl bg-surface-container-highest clay-flat z-50 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {isSearching ? (
                  <div className="flex flex-col items-center gap-3 px-6 py-8 text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl text-primary animate-spin">
                      progress_activity
                    </span>
                    <span className="text-sm font-body">Searching movies…</span>
                  </div>
                ) : results.length > 0 ? (
                  <ul className="max-h-96 overflow-y-auto py-2">
                    {results.map((movie) => (
                      <li key={movie.id}>
                        <Link
                          href={`/movies/${movie.id}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors group"
                        >
                          <div className="relative w-10 h-14 rounded-xl overflow-hidden shrink-0 clay-inset">
                            <Image
                              src={movie.posterVerticalUrl || movie.posterHorizontalUrl || FALLBACK_POSTER}
                              alt={movie.title}
                              fill
                              sizes="40px"
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-headline font-bold text-on-surface text-sm truncate group-hover:text-primary transition-colors">
                              {movie.title}
                            </span>
                            <span className="text-on-surface-variant text-xs font-body truncate">
                              {movie.genre}
                              {movie.language ? ` • ${movie.language}` : ""}
                            </span>
                            <span className="text-on-surface-variant/60 text-xs font-body">
                              {Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-1 transition-all text-base ml-auto shrink-0">
                            arrow_forward
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center gap-3 px-6 py-8 text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl opacity-40">
                      movie_off
                    </span>
                    <div className="text-center">
                      <p className="text-sm font-body font-medium">No movies found</p>
                      <p className="text-xs font-body opacity-60 mt-1">
                        Try a different title
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative user-dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center justify-center p-1 rounded-full transition-all duration-300 ${
                    isDropdownOpen
                      ? "bg-primary text-on-primary ring-4 ring-primary/20 scale-105"
                      : "bg-surface-container-low text-on-surface clay-inset hover:scale-105"
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl">account_circle</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 p-4 rounded-3xl bg-surface-container-highest clay-flat z-100 border border-white/10 backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 px-3 py-3 mb-1 rounded-2xl bg-surface-container-low clay-inset">
                        <span className="material-symbols-outlined text-primary">person</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-on-surface truncate">{user.name}</span>
                          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{user.role}</span>
                        </div>
                      </div>

                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/10 transition-all group font-headline font-bold text-on-surface hover:text-primary"
                        >
                          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">dashboard</span>
                          <span className="text-sm tracking-tight">Admin Dashboard</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-error/10 text-error transition-all text-left group font-headline font-bold w-full"
                      >
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
                        <span className="text-sm tracking-tight">
                          {isLoggingOut ? "Logging out..." : "Sign Out"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-surface/95 backdrop-blur-xl border-t border-white/10 shadow-2xl animate-in slide-in-from-top-2 flex flex-col h-screen overflow-hidden">
          <div className="flex flex-col px-4 py-6 gap-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-on-surface font-headline font-bold text-lg p-4 hover:bg-surface-container rounded-2xl flex items-center gap-4 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">movie</span>
              Movies
            </Link>
            <Link
              href="/theaters"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-on-surface font-headline font-bold text-lg p-4 hover:bg-surface-container rounded-2xl flex items-center gap-4 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">theaters</span>
              Cinemas
            </Link>
            <Link
              href="/bookings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-on-surface font-headline font-bold text-lg p-4 hover:bg-surface-container rounded-2xl flex items-center gap-4 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">confirmation_number</span>
              My Bookings
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
