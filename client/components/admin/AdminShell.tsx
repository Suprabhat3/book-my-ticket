"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ADMIN_MODULES } from "@/lib/admin-modules";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-headline font-extrabold text-on-surface">Admin Dashboard</h1>
          <Link href="/" className="clay-button-secondary px-5 py-2 rounded-xl font-bold text-sm">
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="clay-card bg-surface-container-lowest rounded-2xl p-4 h-fit">
            <nav className="flex flex-col gap-2">
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  pathname === "/admin"
                    ? "bg-primary text-on-primary"
                    : "hover:bg-surface-container-low text-on-surface-variant"
                }`}
              >
                Overview
              </Link>

              {ADMIN_MODULES.map((moduleConfig) => (
                <Link
                  key={moduleConfig.key}
                  href={`/admin/${moduleConfig.key}`}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    pathname === `/admin/${moduleConfig.key}`
                      ? "bg-primary text-on-primary"
                      : "hover:bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  {moduleConfig.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="clay-card bg-surface-container-lowest rounded-2xl p-6">{children}</section>
        </div>
      </div>
    </div>
  );
}
