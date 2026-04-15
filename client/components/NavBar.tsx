"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";
import { clearAuthSession, getAccessToken, getStoredUser } from "@/lib/auth-storage";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

export const NavBar = () => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

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
    <nav className="sticky top-0 z-50 w-full bg-surface/70 backdrop-blur-xl transition-all duration-300">
      <div className="flex justify-between items-center px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="text-2xl font-black text-primary italic font-headline tracking-tight">
          Book Suprabhat&apos;s Ticket
        </div>

        <div className="hidden md:flex items-center gap-10">
          <Link
            href="/"
            className="text-primary border-b-4 border-primary/20 rounded-b-lg font-headline font-bold tracking-tight hover:scale-105 transition-all duration-300"
          >
            Movies
          </Link>
          <Link
            href="/"
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
                  <div className="absolute right-0 mt-3 w-64 p-4 rounded-3xl bg-surface-container-highest clay-flat z-[100] border border-white/10 backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
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
    </nav>
  );
};
