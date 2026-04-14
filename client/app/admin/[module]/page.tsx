"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { createModuleItem, fetchModuleItems } from "@/lib/admin-api";
import { AdminModuleKey, getAdminModuleByKey } from "@/lib/admin-modules";
import { getAccessToken } from "@/lib/auth-storage";

type ListState = unknown[];
type ItemRecord = Record<string, unknown>;
type CityOption = { id: number; name: string };
type TheaterOption = { id: number; name: string; cityId: number };

function normalizeFormValue(key: string, value: string): unknown {
  const numberFields = new Set([
    "cityId",
    "theaterId",
    "screenId",
    "movieId",
    "totalRows",
    "totalCols",
    "seatCapacity",
    "durationMinutes",
    "basePrice",
  ]);

  const dateFields = new Set(["releaseDate", "startTime", "endTime"]);

  if (numberFields.has(key)) {
    return Number(value);
  }

  if (dateFields.has(key)) {
    return new Date(value).toISOString();
  }

  return value;
}

const moduleFieldMap: Record<AdminModuleKey, string[]> = {
  cities: ["name", "state", "country", "isActive", "createdAt"],
  theaters: ["name", "cityId", "addressLine", "pincode", "isActive", "createdAt"],
  screens: ["name", "theaterId", "screenType", "totalRows", "totalCols", "seatCapacity", "isActive"],
  movies: ["title", "language", "genre", "durationMinutes", "releaseDate", "isActive"],
  shows: ["movieId", "theaterId", "screenId", "startTime", "endTime", "basePrice", "status"],
  users: ["name", "email", "role", "createdAt"],
  bookings: ["id", "userId", "showId", "status", "totalAmount", "createdAt"],
  payments: ["id", "bookingId", "status", "amount", "currency", "createdAt"],
};

function toTitleCase(input: string) {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^\w/, (value) => value.toUpperCase());
}

function formatValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Active" : "Inactive";
  if (typeof value === "string" && /At$|Date$|Time$/.test(value)) return value;
  if (typeof value === "string" && !Number.isNaN(Date.parse(value)) && value.includes("T")) {
    return new Date(value).toLocaleString();
  }
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

function getPrimaryLabel(item: ItemRecord) {
  return (
    (typeof item.name === "string" && item.name) ||
    (typeof item.title === "string" && item.title) ||
    (typeof item.email === "string" && item.email) ||
    (typeof item.id === "string" && `ID: ${item.id}`) ||
    (typeof item.id === "number" && `ID: ${item.id}`) ||
    "Record"
  );
}

export default function AdminModulePage() {
  const params = useParams<{ module: string }>();
  const moduleKey = params.module as AdminModuleKey;
  const moduleConfig = useMemo(() => getAdminModuleByKey(moduleKey), [moduleKey]);

  const [items, setItems] = useState<ListState>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [theaterOptions, setTheaterOptions] = useState<TheaterOption[]>([]);
  const [selectedScreenCityId, setSelectedScreenCityId] = useState("");

  useEffect(() => {
    if (!moduleConfig) return;

    const initialState = Object.fromEntries(moduleConfig.fields.map((field) => [field.key, ""]));
    setFormState(initialState);
  }, [moduleConfig]);

  useEffect(() => {
    const loadCityOptions = async () => {
      if (moduleKey !== "theaters" && moduleKey !== "screens") return;

      try {
        const token = getAccessToken();
        const data = await fetchModuleItems("cities", token);
        if (!Array.isArray(data)) {
          setCityOptions([]);
          return;
        }

        const mapped = data
          .map((city) => city as ItemRecord)
          .filter(
            (city) =>
              typeof city.id === "number" &&
              typeof city.name === "string" &&
              (city.isActive === undefined || city.isActive === true),
          )
          .map((city) => ({ id: city.id as number, name: city.name as string }));

        setCityOptions(mapped);
      } catch {
        setCityOptions([]);
      }
    };

    void loadCityOptions();
  }, [moduleKey]);

  useEffect(() => {
    const loadTheaterOptions = async () => {
      if (moduleKey !== "screens") return;

      try {
        const token = getAccessToken();
        const data = await fetchModuleItems("theaters", token);
        if (!Array.isArray(data)) {
          setTheaterOptions([]);
          return;
        }

        const mapped = data
          .map((theater) => theater as ItemRecord)
          .filter(
            (theater) =>
              typeof theater.id === "number" &&
              typeof theater.name === "string" &&
              typeof theater.cityId === "number" &&
              (theater.isActive === undefined || theater.isActive === true),
          )
          .map((theater) => ({
            id: theater.id as number,
            name: theater.name as string,
            cityId: theater.cityId as number,
          }));

        setTheaterOptions(mapped);
      } catch {
        setTheaterOptions([]);
      }
    };

    void loadTheaterOptions();
  }, [moduleKey]);

  const loadItems = async () => {
    if (!moduleConfig) return;

    try {
      setError("");
      setIsLoading(true);
      const token = getAccessToken();
      const data = await fetchModuleItems(moduleConfig.key, token);
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems(data ? [data] : []);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load data.";
      setError(message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [moduleKey]);

  const handleInputChange = (key: string, value: string) => {
    setFormState((previous) => ({ ...previous, [key]: value }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!moduleConfig || !moduleConfig.createEnabled) return;

    try {
      setError("");
      setSuccessMessage("");
      setIsSubmitting(true);

      const payload: Record<string, unknown> = {};
      for (const field of moduleConfig.fields) {
        const value = (formState[field.key] || "").trim();
        if (!value) {
          throw new ApiError(`${field.label} is required.`);
        }
        payload[field.key] = normalizeFormValue(field.key, value);
      }

      const token = getAccessToken();
      await createModuleItem(moduleConfig.key, token, payload);
      setSuccessMessage(`${moduleConfig.label.slice(0, -1)} created successfully.`);

      const reset = Object.fromEntries(moduleConfig.fields.map((field) => [field.key, ""]));
      setFormState(reset);
      setSelectedScreenCityId("");
      await loadItems();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create item.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!moduleConfig) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-headline font-bold">Unknown Module</h2>
        <p className="text-on-surface-variant">This module is not configured.</p>
        <Link href="/admin" className="text-primary font-semibold hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const filteredTheatersForSelectedCity =
    moduleKey === "screens" && selectedScreenCityId
      ? theaterOptions.filter((theater) => String(theater.cityId) === selectedScreenCityId)
      : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">{moduleConfig.label}</h2>
          <p className="text-on-surface-variant mt-1">{moduleConfig.description}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadItems()}
          className="clay-button-secondary px-4 py-2 rounded-xl text-sm font-bold"
        >
          Refresh
        </button>
      </div>

      {moduleConfig.createEnabled ? (
        <form className="clay-inset rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreate}>
          {moduleConfig.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-on-surface">{field.label}</label>
              {field.type === "select" ? (
                <select
                  value={formState[field.key] || ""}
                  onChange={(event) => handleInputChange(field.key, event.target.value)}
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
                >
                  <option value="">Select {field.label}</option>
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : moduleKey === "screens" && field.key === "theaterId" ? (
                <div className="space-y-2">
                  <select
                    value={selectedScreenCityId}
                    onChange={(event) => {
                      setSelectedScreenCityId(event.target.value);
                      handleInputChange("theaterId", "");
                    }}
                    className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none w-full"
                  >
                    <option value="">Select City</option>
                    {cityOptions.map((city) => (
                      <option key={city.id} value={String(city.id)}>
                        {city.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={formState[field.key] || ""}
                    onChange={(event) => handleInputChange(field.key, event.target.value)}
                    disabled={!selectedScreenCityId}
                    className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none w-full disabled:opacity-60"
                  >
                    <option value="">
                      {selectedScreenCityId ? "Select Theater" : "Select City First"}
                    </option>
                    {filteredTheatersForSelectedCity.map((theater) => (
                      <option key={theater.id} value={String(theater.id)}>
                        {theater.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : moduleKey === "theaters" && field.key === "cityId" ? (
                <select
                  value={formState[field.key] || ""}
                  onChange={(event) => handleInputChange(field.key, event.target.value)}
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
                >
                  <option value="">Select City</option>
                  {cityOptions.map((city) => (
                    <option key={city.id} value={String(city.id)}>
                      {city.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formState[field.key] || ""}
                  onChange={(event) => handleInputChange(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
                />
              )}

              {moduleKey === "theaters" && field.key === "cityId" && cityOptions.length === 0 ? (
                <p className="text-xs text-on-surface-variant">
                  No active cities found. Create a city first.
                </p>
              ) : null}
              {moduleKey === "screens" && field.key === "theaterId" && cityOptions.length === 0 ? (
                <p className="text-xs text-on-surface-variant">
                  No active cities found. Create city and theater first.
                </p>
              ) : null}
              {moduleKey === "screens" &&
              field.key === "theaterId" &&
              selectedScreenCityId &&
              filteredTheatersForSelectedCity.length === 0 ? (
                <p className="text-xs text-on-surface-variant">
                  No active theaters in selected city.
                </p>
              ) : null}
            </div>
          ))}

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="clay-button-primary px-6 py-3 rounded-xl font-bold disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : `Create ${moduleConfig.label.slice(0, -1)}`}
            </button>
            {successMessage ? <span className="text-sm text-green-700 font-semibold">{successMessage}</span> : null}
          </div>
        </form>
      ) : null}

      {error ? <p className="text-sm font-semibold text-red-500">{error}</p> : null}

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-on-surface">Existing {moduleConfig.label}</h3>
        {isLoading ? (
          <p className="text-on-surface-variant">Loading records...</p>
        ) : items.length === 0 ? (
          <p className="text-on-surface-variant">No records found yet.</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {items.map((item, index) => {
              const record = (item as ItemRecord) || {};
              const preferredFields = moduleFieldMap[moduleConfig.key];
              const fields = preferredFields.filter((field) => field in record);

              return (
                <div key={index} className="clay-inset rounded-xl p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="font-bold text-on-surface">{getPrimaryLabel(record)}</h4>
                    {"isActive" in record ? (
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          record.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {record.isActive ? "Active" : "Inactive"}
                      </span>
                    ) : null}
                  </div>

                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map((field) => (
                      <div key={field} className="bg-surface-container-low rounded-lg px-3 py-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                          {toTitleCase(field)}
                        </dt>
                        <dd className="text-sm font-medium text-on-surface">{formatValue(record[field])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
