"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchModuleItems } from "@/lib/admin-api";
import { ADMIN_MODULES } from "@/lib/admin-modules";
import { getAccessToken } from "@/lib/auth-storage";

type ModuleCount = {
  key: string;
  count: number;
};

export default function AdminDashboardPage() {
  const visibleModules = useMemo(
    () => ADMIN_MODULES.filter((moduleConfig) => moduleConfig.visible !== false),
    [],
  );
  const [counts, setCounts] = useState<ModuleCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();

        const results = await Promise.all(
          visibleModules.map(async (moduleConfig) => {
            try {
              const data = await fetchModuleItems(moduleConfig.key, token);
              const count = Array.isArray(data) ? data.length : 0;
              return { key: moduleConfig.key, count };
            } catch {
              return { key: moduleConfig.key, count: 0 };
            }
          }),
        );

        setCounts(results);
      } finally {
        setLoading(false);
      }
    };

    void loadCounts();
  }, [visibleModules]);

  const countMap = useMemo(() => {
    return Object.fromEntries(counts.map((item) => [item.key, item.count])) as Record<string, number>;
  }, [counts]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-headline font-bold text-on-surface">Cinema Operations</h2>
        <p className="text-on-surface-variant mt-2">
          Manage cities, theaters, screens, movies, and shows from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleModules.map((moduleConfig) => (
          <article key={moduleConfig.key} className="clay-inset rounded-xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_16px_#c3c3c3,-8px_-8px_16px_#fdfdfd]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-on-surface">{moduleConfig.label}</h3>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface-container-low text-on-surface-variant">
                {loading ? "..." : `${countMap[moduleConfig.key] ?? 0} items`}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant flex-1">{moduleConfig.description}</p>
            <Link
              href={`/admin/${moduleConfig.key}`}
              className="clay-button-secondary px-4 py-2 rounded-xl text-sm font-bold text-center"
            >
              Open {moduleConfig.label}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
