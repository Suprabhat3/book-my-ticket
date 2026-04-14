"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, refreshAccessToken } from "@/lib/api";
import { AuthUser, clearAuthSession, getAccessToken, getStoredUser, setAccessToken } from "@/lib/auth-storage";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const ensureAdminSession = async () => {
      const sessionUser = getStoredUser();
      const token = getAccessToken();

      if (!sessionUser || !token) {
        clearAuthSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const meResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"}/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            cache: "no-store",
          },
        );

        if (meResponse.status === 401) {
          const nextToken = await refreshAccessToken();
          setAccessToken(nextToken);
        } else if (!meResponse.ok) {
          throw new ApiError("Unable to validate session");
        }

        setUser(sessionUser);
        setIsChecking(false);
      } catch (error) {
        const isApiError = error instanceof ApiError;
        if (isApiError) {
          clearAuthSession();
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        clearAuthSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    void ensureAdminSession();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">
        Checking admin session...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="clay-card bg-surface-container-lowest rounded-2xl p-8 max-w-xl w-full text-center">
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">Admin Access Required</h2>
          <p className="text-on-surface-variant mb-6">
            This section is restricted to admin accounts only.
          </p>
          <Link href="/" className="clay-button-secondary inline-flex px-6 py-3 rounded-xl font-bold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
