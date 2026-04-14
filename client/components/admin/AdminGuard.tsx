"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthUser, getStoredUser } from "@/lib/auth-storage";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const sessionUser = getStoredUser();
    setUser(sessionUser);

    if (!sessionUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsChecking(false);
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
