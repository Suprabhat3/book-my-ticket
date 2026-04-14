"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { createModuleItem, fetchModuleItems } from "@/lib/admin-api";
import { AdminModuleKey, getAdminModuleByKey } from "@/lib/admin-modules";
import { getAccessToken } from "@/lib/auth-storage";
import { uploadMoviePosterToImageKit } from "@/lib/imagekit-upload";

type ListState = unknown[];
type ItemRecord = Record<string, unknown>;
type CityOption = { id: number; name: string };
type TheaterOption = { id: number; name: string; cityId: number };
type ScreenOption = { id: number; name: string; theaterId: number };
type MovieOption = { id: number; title: string };
type ShowAssignment = { theaterId: string; screenId: string };
type PosterVariant = "vertical" | "horizontal";

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
  movies: [
    "title",
    "language",
    "genre",
    "durationMinutes",
    "releaseDate",
    "posterVerticalUrl",
    "posterHorizontalUrl",
    "isActive",
  ],
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
  const [screenOptions, setScreenOptions] = useState<ScreenOption[]>([]);
  const [movieOptions, setMovieOptions] = useState<MovieOption[]>([]);
  const [uploadingPosters, setUploadingPosters] = useState<Record<PosterVariant, boolean>>({
    vertical: false,
    horizontal: false,
  });
  const [posterPreviewUrls, setPosterPreviewUrls] = useState<Record<PosterVariant, string>>({
    vertical: "",
    horizontal: "",
  });
  const [selectedPosterFiles, setSelectedPosterFiles] = useState<Record<PosterVariant, File | null>>({
    vertical: null,
    horizontal: null,
  });
  const [showAssignments, setShowAssignments] = useState<ShowAssignment[]>([
    { theaterId: "", screenId: "" },
  ]);

  useEffect(() => {
    return () => {
      Object.values(posterPreviewUrls).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [posterPreviewUrls]);

  useEffect(() => {
    if (!moduleConfig) return;

    const initialState = Object.fromEntries(moduleConfig.fields.map((field) => [field.key, ""]));
    if (moduleConfig.key === "movies") {
      initialState.posterVerticalUrl = "";
      initialState.posterVerticalImagekitFileId = "";
      initialState.posterHorizontalUrl = "";
      initialState.posterHorizontalImagekitFileId = "";
    }
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
      if (moduleKey !== "screens" && moduleKey !== "shows") return;

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

  useEffect(() => {
    const loadScreenOptions = async () => {
      if (moduleKey !== "shows") return;

      try {
        const token = getAccessToken();
        const data = await fetchModuleItems("screens", token);
        if (!Array.isArray(data)) {
          setScreenOptions([]);
          return;
        }

        const mapped = data
          .map((screen) => screen as ItemRecord)
          .filter(
            (screen) =>
              typeof screen.id === "number" &&
              typeof screen.name === "string" &&
              typeof screen.theaterId === "number" &&
              (screen.isActive === undefined || screen.isActive === true),
          )
          .map((screen) => ({
            id: screen.id as number,
            name: screen.name as string,
            theaterId: screen.theaterId as number,
          }));

        setScreenOptions(mapped);
      } catch {
        setScreenOptions([]);
      }
    };

    void loadScreenOptions();
  }, [moduleKey]);

  useEffect(() => {
    const loadMovieOptions = async () => {
      if (moduleKey !== "shows") return;

      try {
        const token = getAccessToken();
        const data = await fetchModuleItems("movies", token);
        if (!Array.isArray(data)) {
          setMovieOptions([]);
          return;
        }

        const mapped = data
          .map((movie) => movie as ItemRecord)
          .filter(
            (movie) =>
              typeof movie.id === "number" &&
              typeof movie.title === "string" &&
              (movie.isActive === undefined || movie.isActive === true),
          )
          .map((movie) => ({
            id: movie.id as number,
            title: movie.title as string,
          }));

        setMovieOptions(mapped);
      } catch {
        setMovieOptions([]);
      }
    };

    void loadMovieOptions();
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

  const setPosterPreviewUrl = (variant: PosterVariant, nextUrl: string) => {
    setPosterPreviewUrls((previous) => {
      const current = previous[variant];
      if (current && current !== nextUrl && current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return { ...previous, [variant]: nextUrl };
    });
  };

  const clearPosterPreviews = () => {
    setPosterPreviewUrls((previous) => {
      Object.values(previous).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });

      return { vertical: "", horizontal: "" };
    });
  };

  const handlePosterUpload = async (variant: PosterVariant, file: File | null) => {
    if (!file) return;

    try {
      setError("");
      setSuccessMessage("");
      setUploadingPosters((previous) => ({ ...previous, [variant]: true }));
      setSelectedPosterFiles((previous) => ({ ...previous, [variant]: file }));

      const localPreviewUrl = URL.createObjectURL(file);
      setPosterPreviewUrl(variant, localPreviewUrl);

      const token = getAccessToken();
      const uploadResult = await uploadMoviePosterToImageKit({
        file,
        variant,
        accessToken: token,
        movieTitle: formState.title || "movie",
      });

      if (variant === "vertical") {
        setFormState((previous) => ({
          ...previous,
          posterVerticalUrl: uploadResult.url,
          posterVerticalImagekitFileId: uploadResult.fileId,
        }));
      } else {
        setFormState((previous) => ({
          ...previous,
          posterHorizontalUrl: uploadResult.url,
          posterHorizontalImagekitFileId: uploadResult.fileId,
        }));
      }
      setPosterPreviewUrl(variant, uploadResult.url);

      setSuccessMessage(`${variant === "vertical" ? "Vertical" : "Horizontal"} poster uploaded.`);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Failed to upload image.";
      setError(message);
    } finally {
      setUploadingPosters((previous) => ({ ...previous, [variant]: false }));
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!moduleConfig || !moduleConfig.createEnabled) return;

    try {
      setError("");
      setSuccessMessage("");
      setIsSubmitting(true);

      if (moduleKey === "shows") {
        const movieId = (formState.movieId || "").trim();
        const startTime = (formState.startTime || "").trim();
        const endTime = (formState.endTime || "").trim();
        const basePrice = (formState.basePrice || "").trim();

        if (!movieId || !startTime || !endTime || !basePrice) {
          throw new ApiError("Movie, start time, end time, and base price are required.");
        }

        if (showAssignments.length === 0) {
          throw new ApiError("Add at least one theater/screen entry.");
        }

        const uniqueCheck = new Set<string>();
        for (const assignment of showAssignments) {
          if (!assignment.theaterId || !assignment.screenId) {
            throw new ApiError("Each row must have theater and screen selected.");
          }

          const key = `${assignment.theaterId}-${assignment.screenId}`;
          if (uniqueCheck.has(key)) {
            throw new ApiError("Duplicate theater/screen pair selected.");
          }
          uniqueCheck.add(key);
        }

        const token = getAccessToken();
        await Promise.all(
          showAssignments.map((assignment) =>
            createModuleItem("shows", token, {
              movieId: normalizeFormValue("movieId", movieId),
              theaterId: normalizeFormValue("theaterId", assignment.theaterId),
              screenId: normalizeFormValue("screenId", assignment.screenId),
              startTime: normalizeFormValue("startTime", startTime),
              endTime: normalizeFormValue("endTime", endTime),
              basePrice: normalizeFormValue("basePrice", basePrice),
            }),
          ),
        );

        setSuccessMessage("Shows created successfully for selected theater/screen entries.");
        setFormState((previous) => ({
          ...previous,
          movieId: "",
          startTime: "",
          endTime: "",
          basePrice: "",
        }));
        setShowAssignments([{ theaterId: "", screenId: "" }]);
        await loadItems();
        return;
      }

      if (moduleKey === "movies") {
        const payload: Record<string, unknown> = {};
        for (const field of moduleConfig.fields) {
          const value = (formState[field.key] || "").trim();
          if (!value) {
            throw new ApiError(`${field.label} is required.`);
          }
          payload[field.key] = normalizeFormValue(field.key, value);
        }

        let posterVerticalUrl = (formState.posterVerticalUrl || "").trim();
        let posterHorizontalUrl = (formState.posterHorizontalUrl || "").trim();
        let posterVerticalImagekitFileId = (formState.posterVerticalImagekitFileId || "").trim();
        let posterHorizontalImagekitFileId = (formState.posterHorizontalImagekitFileId || "").trim();

        const token = getAccessToken();

        if (!posterVerticalUrl && selectedPosterFiles.vertical) {
          const uploadedVertical = await uploadMoviePosterToImageKit({
            file: selectedPosterFiles.vertical,
            variant: "vertical",
            accessToken: token,
            movieTitle: formState.title || "movie",
          });
          posterVerticalUrl = uploadedVertical.url;
          posterVerticalImagekitFileId = uploadedVertical.fileId;
          setFormState((previous) => ({
            ...previous,
            posterVerticalUrl: uploadedVertical.url,
            posterVerticalImagekitFileId: uploadedVertical.fileId,
          }));
          setPosterPreviewUrl("vertical", uploadedVertical.url);
        }

        if (!posterHorizontalUrl && selectedPosterFiles.horizontal) {
          const uploadedHorizontal = await uploadMoviePosterToImageKit({
            file: selectedPosterFiles.horizontal,
            variant: "horizontal",
            accessToken: token,
            movieTitle: formState.title || "movie",
          });
          posterHorizontalUrl = uploadedHorizontal.url;
          posterHorizontalImagekitFileId = uploadedHorizontal.fileId;
          setFormState((previous) => ({
            ...previous,
            posterHorizontalUrl: uploadedHorizontal.url,
            posterHorizontalImagekitFileId: uploadedHorizontal.fileId,
          }));
          setPosterPreviewUrl("horizontal", uploadedHorizontal.url);
        }

        if (!posterVerticalUrl || !posterHorizontalUrl) {
          throw new ApiError("Upload both vertical and horizontal movie posters.");
        }

        payload.posterVerticalUrl = posterVerticalUrl;
        payload.posterHorizontalUrl = posterHorizontalUrl;
        if (posterVerticalImagekitFileId) {
          payload.posterVerticalImagekitFileId = posterVerticalImagekitFileId;
        }
        if (posterHorizontalImagekitFileId) {
          payload.posterHorizontalImagekitFileId = posterHorizontalImagekitFileId;
        }

        await createModuleItem(moduleConfig.key, token, payload);
        setSuccessMessage("Movie created successfully.");

        const reset = Object.fromEntries(moduleConfig.fields.map((field) => [field.key, ""]));
        setFormState({
          ...reset,
          posterVerticalUrl: "",
          posterVerticalImagekitFileId: "",
          posterHorizontalUrl: "",
          posterHorizontalImagekitFileId: "",
        });
        setSelectedPosterFiles({ vertical: null, horizontal: null });
        clearPosterPreviews();
        await loadItems();
        return;
      }

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
  const isShowsModule = moduleKey === "shows";
  const isMoviesModule = moduleKey === "movies";
  const isAnyPosterUploading = uploadingPosters.vertical || uploadingPosters.horizontal;

  const getScreensByTheater = (theaterId: string) =>
    screenOptions.filter((screen) => String(screen.theaterId) === theaterId);

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
          {isShowsModule ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Movie</label>
                <select
                  value={formState.movieId || ""}
                  onChange={(event) => handleInputChange("movieId", event.target.value)}
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
                >
                  <option value="">Select Movie</option>
                  {movieOptions.map((movie) => (
                    <option key={movie.id} value={String(movie.id)}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Base Price</label>
                <input
                  type="number"
                  placeholder="250"
                  value={formState.basePrice || ""}
                  onChange={(event) => handleInputChange("basePrice", event.target.value)}
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Start Time</label>
                <input
                  type="datetime-local"
                  value={formState.startTime || ""}
                  onChange={(event) => handleInputChange("startTime", event.target.value)}
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">End Time</label>
                <input
                  type="datetime-local"
                  value={formState.endTime || ""}
                  onChange={(event) => handleInputChange("endTime", event.target.value)}
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
                />
              </div>

              <div className="md:col-span-2 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-on-surface">Theater and Screen Assignments</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setShowAssignments((previous) => [...previous, { theaterId: "", screenId: "" }])
                    }
                    className="clay-button-secondary px-3 py-2 rounded-lg text-xs font-bold"
                  >
                    Add Theater/Screen
                  </button>
                </div>

                <div className="space-y-3">
                  {showAssignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end bg-surface-container-low rounded-xl p-3"
                    >
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-on-surface-variant">Theater</label>
                        <select
                          value={assignment.theaterId}
                          onChange={(event) =>
                            setShowAssignments((previous) =>
                              previous.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { theaterId: event.target.value, screenId: "" }
                                  : row,
                              ),
                            )
                          }
                          className="rounded-lg px-3 py-2 bg-surface border border-surface-container-high outline-none"
                        >
                          <option value="">Select Theater</option>
                          {theaterOptions.map((theater) => (
                            <option key={theater.id} value={String(theater.id)}>
                              {theater.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-on-surface-variant">Screen</label>
                        <select
                          value={assignment.screenId}
                          onChange={(event) =>
                            setShowAssignments((previous) =>
                              previous.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, screenId: event.target.value } : row,
                              ),
                            )
                          }
                          disabled={!assignment.theaterId}
                          className="rounded-lg px-3 py-2 bg-surface border border-surface-container-high outline-none disabled:opacity-60"
                        >
                          <option value="">
                            {assignment.theaterId ? "Select Screen" : "Select Theater First"}
                          </option>
                          {getScreensByTheater(assignment.theaterId).map((screen) => (
                            <option key={screen.id} value={String(screen.id)}>
                              {screen.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowAssignments((previous) =>
                            previous.length === 1
                              ? previous
                              : previous.filter((_, rowIndex) => rowIndex !== index),
                          )
                        }
                        disabled={showAssignments.length === 1}
                        className="clay-button-secondary px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
          moduleConfig.fields.map((field) => (
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
          ))
          )}

          {isMoviesModule ? (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
                <label className="text-sm font-semibold text-on-surface">Vertical Poster (card)</label>
                <p className="text-xs text-on-surface-variant">Display ratio: 2:3 (auto-cropped in preview)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handlePosterUpload("vertical", event.target.files?.[0] || null)}
                  disabled={uploadingPosters.vertical}
                  className="rounded-xl px-3 py-2 bg-surface border border-surface-container-high outline-none"
                />
                <p className="text-xs text-on-surface-variant">
                  {uploadingPosters.vertical
                    ? "Uploading..."
                    : formState.posterVerticalUrl
                      ? "Uploaded"
                      : "Not uploaded"}
                </p>
                {formState.posterVerticalUrl ? (
                  <a
                    href={formState.posterVerticalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View uploaded image
                  </a>
                ) : null}
                {posterPreviewUrls.vertical || formState.posterVerticalUrl ? (
                  <div className="mt-1 rounded-lg overflow-hidden border border-surface-container-high bg-surface aspect-2/3">
                    <img
                      src={posterPreviewUrls.vertical || formState.posterVerticalUrl}
                      alt="Vertical poster preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
                <label className="text-sm font-semibold text-on-surface">Horizontal Poster (banner)</label>
                <p className="text-xs text-on-surface-variant">Display ratio: 16:9 (auto-cropped in preview)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handlePosterUpload("horizontal", event.target.files?.[0] || null)}
                  disabled={uploadingPosters.horizontal}
                  className="rounded-xl px-3 py-2 bg-surface border border-surface-container-high outline-none"
                />
                <p className="text-xs text-on-surface-variant">
                  {uploadingPosters.horizontal
                    ? "Uploading..."
                    : formState.posterHorizontalUrl
                      ? "Uploaded"
                      : "Not uploaded"}
                </p>
                {formState.posterHorizontalUrl ? (
                  <a
                    href={formState.posterHorizontalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View uploaded image
                  </a>
                ) : null}
                {posterPreviewUrls.horizontal || formState.posterHorizontalUrl ? (
                  <div className="mt-1 rounded-lg overflow-hidden border border-surface-container-high bg-surface aspect-video">
                    <img
                      src={posterPreviewUrls.horizontal || formState.posterHorizontalUrl}
                      alt="Horizontal poster preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || isAnyPosterUploading}
              className="clay-button-primary px-6 py-3 rounded-xl font-bold disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : isAnyPosterUploading ? "Uploading images..." : `Create ${moduleConfig.label.slice(0, -1)}`}
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
                        {moduleKey === "movies" &&
                        (field === "posterVerticalUrl" || field === "posterHorizontalUrl") &&
                        typeof record[field] === "string" &&
                        record[field] ? (
                          <dd className="mt-2">
                            <div
                              className={`overflow-hidden rounded-lg border border-surface-container-high bg-surface ${
                                field === "posterVerticalUrl" ? "aspect-2/3" : "aspect-video"
                              }`}
                            >
                              <img
                                src={record[field] as string}
                                alt={`${field === "posterVerticalUrl" ? "Vertical" : "Horizontal"} poster`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </dd>
                        ) : (
                          <dd className="text-sm font-medium text-on-surface">{formatValue(record[field])}</dd>
                        )}
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
