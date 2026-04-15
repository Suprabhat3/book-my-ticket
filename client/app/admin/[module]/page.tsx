"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  createModuleItem,
  deleteModuleItem,
  fetchModuleItems,
  fetchScreenSeatTypeSummary,
  ScreenSeatType,
  updateModuleItem,
} from "@/lib/admin-api";
import { AdminModuleKey, getAdminModuleByKey } from "@/lib/admin-modules";
import { getAccessToken } from "@/lib/auth-storage";
import { uploadMoviePosterToImageKit } from "@/lib/imagekit-upload";
import { SeatLayoutPreview } from "@/components/seat-layout-preview";

type ListState = unknown[];
type ItemRecord = Record<string, unknown>;
type CityOption = { id: number; name: string };
type TheaterOption = { id: number; name: string; cityId: number };
type ScreenOption = { id: number; name: string; theaterId: number };
type MovieOption = { id: number; title: string; durationMinutes: number; releaseDate: string };
type UserLookup = Record<string, { name: string; email: string }>;
type SeatTypePriceMap = Partial<Record<ScreenSeatType, string>>;
type ShowAssignment = {
  theaterId: string;
  screenId: string;
  seatTypePrices: SeatTypePriceMap;
  availableSeatTypes: ScreenSeatType[];
  loadingSeatTypes: boolean;
};
type PosterVariant = "vertical" | "horizontal";

const seatTypeLabelMap: Record<ScreenSeatType, string> = {
  REGULAR: "Regular",
  PREMIUM: "Premium",
  RECLINER: "Recliner",
};

function createEmptyShowAssignment(): ShowAssignment {
  return {
    theaterId: "",
    screenId: "",
    seatTypePrices: {},
    availableSeatTypes: [],
    loadingSeatTypes: false,
  };
}

function calculateShowEndTime(startTimeLocal: string, durationMinutes: number) {
  const start = new Date(startTimeLocal);
  if (!startTimeLocal || Number.isNaN(start.getTime()) || durationMinutes <= 0) {
    return "";
  }

  const end = new Date(start.getTime() + (durationMinutes + 20) * 60 * 1000);
  end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
  return end.toISOString().slice(0, 16);
}

function toDateTimeLocalInputValue(value: string) {
  const parsed = parseApiDate(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  parsed.setMinutes(parsed.getMinutes() - parsed.getTimezoneOffset());
  return parsed.toISOString().slice(0, 16);
}

function parseApiDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return new Date(NaN);
  }

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const normalizedDate = new Date(normalized);
  if (!Number.isNaN(normalizedDate.getTime())) {
    return normalizedDate;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const dateOnly = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!Number.isNaN(dateOnly.getTime())) {
      return dateOnly;
    }
  }

  return new Date(NaN);
}

function formatReleaseDateForAdmin(value: unknown) {
  const parsed = parseApiDate(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Release date not available";
  }

  return parsed.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase();
}

function formatDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmountINR(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "N/A";
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
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
  const [showAssignments, setShowAssignments] = useState<ShowAssignment[]>([createEmptyShowAssignment()]);
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | number | null>(null);
  const [listFilters, setListFilters] = useState<Record<string, string>>({});
  const [userLookup, setUserLookup] = useState<UserLookup>({});

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
      if (moduleKey !== "theaters" && moduleKey !== "screens" && moduleKey !== "shows") return;

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
              typeof movie.durationMinutes === "number" &&
              typeof movie.releaseDate === "string" &&
              (movie.isActive === undefined || movie.isActive === true),
          )
          .map((movie) => ({
            id: movie.id as number,
            title: movie.title as string,
            durationMinutes: movie.durationMinutes as number,
            releaseDate: movie.releaseDate as string,
          }));

        setMovieOptions(mapped);
      } catch {
        setMovieOptions([]);
      }
    };

    void loadMovieOptions();
  }, [moduleKey]);

  useEffect(() => {
    setListFilters({});
  }, [moduleKey]);

  useEffect(() => {
    const loadUserLookup = async () => {
      if (moduleKey !== "bookings") {
        setUserLookup({});
        return;
      }

      try {
        const token = getAccessToken();
        const data = await fetchModuleItems("users", token);
        if (!Array.isArray(data)) {
          setUserLookup({});
          return;
        }

        const lookup: UserLookup = {};
        for (const userItem of data) {
          const user = userItem as ItemRecord;
          if (typeof user.id !== "string") continue;
          lookup[user.id] = {
            name: typeof user.name === "string" && user.name.trim() ? user.name : "Unknown User",
            email: typeof user.email === "string" ? user.email : "",
          };
        }

        setUserLookup(lookup);
      } catch {
        setUserLookup({});
      }
    };

    void loadUserLookup();
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

  useEffect(() => {
    if (moduleKey !== "shows") return;

    const movieId = Number(formState.movieId || "");
    const startTime = formState.startTime || "";

    if (!Number.isFinite(movieId) || movieId <= 0 || !startTime) {
      setFormState((previous) => ({ ...previous, endTime: "" }));
      return;
    }

    const selectedMovie = movieOptions.find((movie) => movie.id === movieId);
    if (!selectedMovie) {
      setFormState((previous) => ({ ...previous, endTime: "" }));
      return;
    }

    const calculatedEndTime = calculateShowEndTime(startTime, selectedMovie.durationMinutes);
    setFormState((previous) =>
      previous.endTime === calculatedEndTime ? previous : { ...previous, endTime: calculatedEndTime },
    );
  }, [moduleKey, movieOptions, formState.movieId, formState.startTime]);

  useEffect(() => {
    if (moduleKey !== "shows") return;
    if (!formState.movieId) return;

    const selectedMovie = movieOptions.find((movie) => String(movie.id) === formState.movieId);
    if (!selectedMovie) return;

    const releaseDateLocal = toDateTimeLocalInputValue(selectedMovie.releaseDate);
    if (!releaseDateLocal) return;

    setFormState((previous) => {
      const currentStart = previous.startTime || "";
      if (!currentStart) {
        return {
          ...previous,
          startTime: releaseDateLocal,
        };
      }

      const currentStartDate = new Date(currentStart);
      const releaseDate = new Date(releaseDateLocal);
      if (Number.isNaN(currentStartDate.getTime()) || currentStartDate < releaseDate) {
        return {
          ...previous,
          startTime: releaseDateLocal,
        };
      }

      return previous;
    });
  }, [moduleKey, movieOptions, formState.movieId]);

  const handleInputChange = (key: string, value: string) => {
    setFormState((previous) => ({ ...previous, [key]: value }));
  };

  const loadSeatTypesForAssignment = async (
    assignmentIndex: number,
    screenId: string,
    presetPrices?: SeatTypePriceMap,
  ) => {
    const parsedScreenId = Number(screenId);
    if (!Number.isFinite(parsedScreenId) || parsedScreenId <= 0) {
      return;
    }

    try {
      setShowAssignments((previous) =>
        previous.map((row, rowIndex) =>
          rowIndex === assignmentIndex
            ? {
                ...row,
                loadingSeatTypes: true,
                availableSeatTypes: [],
                seatTypePrices: presetPrices || row.seatTypePrices,
              }
            : row,
        ),
      );

      const token = getAccessToken();
      const summary = await fetchScreenSeatTypeSummary(parsedScreenId, token);
      const seatTypes = summary.seatTypes || [];

      setShowAssignments((previous) =>
        previous.map((row, rowIndex) => {
          if (rowIndex !== assignmentIndex || row.screenId !== screenId) {
            return row;
          }

          const nextPrices: SeatTypePriceMap = {};
          for (const seatType of seatTypes) {
            nextPrices[seatType] =
              (presetPrices && presetPrices[seatType]) || row.seatTypePrices[seatType] || "";
          }

          return {
            ...row,
            loadingSeatTypes: false,
            availableSeatTypes: seatTypes,
            seatTypePrices: nextPrices,
          };
        }),
      );
    } catch (seatTypeError) {
      setShowAssignments((previous) =>
        previous.map((row, rowIndex) =>
          rowIndex === assignmentIndex && row.screenId === screenId
            ? { ...row, loadingSeatTypes: false, availableSeatTypes: [] }
            : row,
        ),
      );
      const message = seatTypeError instanceof Error ? seatTypeError.message : "Unable to load seat types for selected screen.";
      setError(message);
    }
  };

  const buildShowPricingPayload = (assignment: ShowAssignment, rowIndex: number) => {
    if (assignment.availableSeatTypes.length === 0) {
      throw new ApiError(`Row ${rowIndex + 1}: select a screen with active seats.`);
    }

    const resolvedPrices: Partial<Record<ScreenSeatType, number>> = {};
    for (const seatType of assignment.availableSeatTypes) {
      const rawValue = (assignment.seatTypePrices[seatType] || "").trim();
      if (!rawValue) {
        throw new ApiError(`Row ${rowIndex + 1}: enter price for ${seatTypeLabelMap[seatType]} seats.`);
      }

      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw new ApiError(`Row ${rowIndex + 1}: ${seatTypeLabelMap[seatType]} price must be greater than 0.`);
      }

      resolvedPrices[seatType] = numericValue;
    }

    const basePrice = resolvedPrices.REGULAR || resolvedPrices.PREMIUM || resolvedPrices.RECLINER;
    if (!basePrice) {
      throw new ApiError(`Row ${rowIndex + 1}: at least one valid seat price is required.`);
    }

    return {
      basePrice,
      pricingProfile: {
        ...(resolvedPrices.PREMIUM ? { premiumPrice: resolvedPrices.PREMIUM } : {}),
        ...(resolvedPrices.RECLINER ? { reclinerPrice: resolvedPrices.RECLINER } : {}),
      },
    };
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
        const selectedMovie = movieOptions.find((movie) => String(movie.id) === movieId);
        const endTime = selectedMovie
          ? calculateShowEndTime(startTime, selectedMovie.durationMinutes)
          : (formState.endTime || "").trim();

        if (!movieId || !startTime || !endTime) {
          throw new ApiError("Movie and start time are required.");
        }

        if (selectedMovie) {
          const showStart = new Date(startTime);
          const movieRelease = new Date(selectedMovie.releaseDate);

          if (Number.isNaN(showStart.getTime()) || Number.isNaN(movieRelease.getTime())) {
            throw new ApiError("Invalid movie release date or show start time.");
          }

          if (showStart < movieRelease) {
            throw new ApiError("Show start time cannot be before movie release date.");
          }
        }

        if (showAssignments.length === 0) {
          throw new ApiError("Add at least one theater/screen entry.");
        }

        const uniqueCheck = new Set<string>();
        const showPayloads = showAssignments.map((assignment, index) => {
          if (!assignment.theaterId || !assignment.screenId) {
            throw new ApiError("Each row must have theater and screen selected.");
          }

          const key = `${assignment.theaterId}-${assignment.screenId}`;
          if (uniqueCheck.has(key)) {
            throw new ApiError("Duplicate theater/screen pair selected.");
          }
          uniqueCheck.add(key);

          const pricing = buildShowPricingPayload(assignment, index);

          return {
            movieId: normalizeFormValue("movieId", movieId),
            theaterId: normalizeFormValue("theaterId", assignment.theaterId),
            screenId: normalizeFormValue("screenId", assignment.screenId),
            startTime: normalizeFormValue("startTime", startTime),
            endTime: normalizeFormValue("endTime", endTime),
            basePrice: pricing.basePrice,
            pricingProfile: pricing.pricingProfile,
          };
        });

        const token = getAccessToken();
        if (editingItemId) {
          await updateModuleItem("shows", editingItemId, token, showPayloads[0]);
          setSuccessMessage("Show updated successfully.");
        } else {
          await Promise.all(showPayloads.map((payload) => createModuleItem("shows", token, payload)));
          setSuccessMessage("Shows created successfully for selected theater/screen entries.");
        }

        setFormState((previous) => ({
          ...previous,
          movieId: "",
          startTime: "",
          endTime: "",
        }));
        setShowAssignments([createEmptyShowAssignment()]);
        await loadItems();
        setShowForm(false);
        setEditingItemId(null);
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

        if (editingItemId) {
          await updateModuleItem(moduleConfig.key, editingItemId, token, payload);
          setSuccessMessage("Movie updated successfully.");
        } else {
          await createModuleItem(moduleConfig.key, token, payload);
          setSuccessMessage("Movie created successfully.");
        }

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
        setShowForm(false);
        setEditingItemId(null);
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

      if (moduleKey === "screens") {
        const regularR = Number(payload.regularRows) || 0;
        const premiumR = Number(payload.premiumRows) || 0;
        const reclinerR = Number(payload.reclinerRows) || 0;
        const rows = regularR + premiumR + reclinerR;
        const cols = Number(payload.totalCols) || 0;
        
        payload.totalRows = rows;
        const reclinerCapacity = reclinerR * Math.floor(cols / 2);
        const normalCapacity = (regularR + premiumR) * cols;
        payload.seatCapacity = normalCapacity + reclinerCapacity;
        
        payload.layoutProfile = {
          regularRows: regularR,
          premiumRows: premiumR,
          reclinerRows: reclinerR,
        };

        delete payload.regularRows;
        delete payload.premiumRows;
        delete payload.reclinerRows;
      }

      const token = getAccessToken();
      if (editingItemId) {
        await updateModuleItem(moduleConfig.key, editingItemId, token, payload);
        setSuccessMessage(`${moduleConfig.label.slice(0, -1)} updated successfully.`);
      } else {
        await createModuleItem(moduleConfig.key, token, payload);
        setSuccessMessage(`${moduleConfig.label.slice(0, -1)} created successfully.`);
      }

      const reset = Object.fromEntries(moduleConfig.fields.map((field) => [field.key, ""]));
      setFormState(reset);
      setSelectedScreenCityId("");
      await loadItems();
      setShowForm(false);
      setEditingItemId(null);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create item.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequest = (item: ItemRecord) => {
    if (!moduleConfig) return;
    setEditingItemId(item.id as string | number);
    setError("");
    setSuccessMessage("");

    const stateToSet: Record<string, string> = {};
    for (const field of moduleConfig.fields) {
      if (field.key in item && item[field.key] !== null && item[field.key] !== undefined) {
        let val = String(item[field.key]);
        if (field.type === "datetime-local" && val.includes("T")) {
          const dateObj = new Date(val);
          if (!isNaN(dateObj.getTime())) {
            dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
            val = dateObj.toISOString().slice(0, 16);
          }
        }
        stateToSet[field.key] = val;
      } else {
        stateToSet[field.key] = "";
      }
    }

    if (moduleKey === "screens" && item.layoutProfile) {
      const layout = item.layoutProfile as Record<string, any>;
      stateToSet.regularRows = String(layout.regularRows || 0);
      stateToSet.premiumRows = String(layout.premiumRows || 0);
      stateToSet.reclinerRows = String(layout.reclinerRows || 0);
    }
    
    if (moduleKey === "movies") {
      stateToSet.posterVerticalUrl = (item.posterVerticalUrl as string) || "";
      stateToSet.posterHorizontalUrl = (item.posterHorizontalUrl as string) || "";
      stateToSet.posterVerticalImagekitFileId = (item.posterVerticalImagekitFileId as string) || "";
      stateToSet.posterHorizontalImagekitFileId = (item.posterHorizontalImagekitFileId as string) || "";
      if (stateToSet.posterVerticalUrl) setPosterPreviewUrl("vertical", stateToSet.posterVerticalUrl);
      if (stateToSet.posterHorizontalUrl) setPosterPreviewUrl("horizontal", stateToSet.posterHorizontalUrl);
    }

    if (moduleKey === "shows") {
      const pricing = (item.pricingProfile || {}) as Record<string, unknown>;
      const prefilledPrices: SeatTypePriceMap = {
        REGULAR: String(item.basePrice || ""),
        PREMIUM: String(pricing.premiumPrice || ""),
        RECLINER: String(pricing.reclinerPrice || ""),
      };
      const screenId = String(item.screenId || "");

      setShowAssignments([
        {
          theaterId: String(item.theaterId || ""),
          screenId,
          seatTypePrices: prefilledPrices,
          availableSeatTypes: [],
          loadingSeatTypes: Boolean(screenId),
        },
      ]);

      if (screenId) {
        void loadSeatTypesForAssignment(0, screenId, prefilledPrices);
      }
    }

    if (moduleKey === "screens" || moduleKey === "shows") {
      const theater = theaterOptions.find(t => t.id === Number(item.theaterId));
      if (theater) {
        setSelectedScreenCityId(String(theater.cityId));
      }
    }

    setFormState(stateToSet);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setShowForm(false);
    const reset = Object.fromEntries(moduleConfig?.fields.map((field) => [field.key, ""]) || []);
    setFormState(reset);
    clearPosterPreviews();
    setSelectedScreenCityId("");
    setShowAssignments([createEmptyShowAssignment()]);
  };

  const handleDeleteRequest = async (item: ItemRecord) => {
    if (!moduleConfig) return;
    if (!moduleConfig.deleteEnabled) return;

    const itemId = item.id as string | number | undefined;
    if (itemId === undefined || itemId === null || itemId === "") {
      setError("Unable to delete this record because it has no valid id.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${moduleConfig.label.slice(0, -1)} \"${getPrimaryLabel(item)}\"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setDeletingItemId(itemId);

      const token = getAccessToken();
      await deleteModuleItem(moduleConfig.key, itemId, token);
      setSuccessMessage(`${moduleConfig.label.slice(0, -1)} deleted successfully.`);

      if (editingItemId === itemId) {
        handleCancelEdit();
      }

      await loadItems();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete item.";
      setError(message);
    } finally {
      setDeletingItemId(null);
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
  const isScreensModule = moduleKey === "screens";
  const isShowsModule = moduleKey === "shows";
  const isMoviesModule = moduleKey === "movies";
  const isAnyPosterUploading = uploadingPosters.vertical || uploadingPosters.horizontal;
  const selectedShowMovie =
    isShowsModule && formState.movieId
      ? movieOptions.find((movie) => String(movie.id) === formState.movieId)
      : undefined;

  const getScreensByTheater = (theaterId: string) =>
    screenOptions.filter((screen) => String(screen.theaterId) === theaterId);

  const cityNameById = useMemo(
    () => new Map(cityOptions.map((city) => [city.id, city.name])),
    [cityOptions],
  );
  const theaterById = useMemo(
    () => new Map(theaterOptions.map((theater) => [theater.id, theater])),
    [theaterOptions],
  );
  const movieById = useMemo(
    () => new Map(movieOptions.map((movie) => [movie.id, movie])),
    [movieOptions],
  );
  const screenById = useMemo(
    () => new Map(screenOptions.map((screen) => [screen.id, screen])),
    [screenOptions],
  );

  const statusOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const item of items) {
      const record = item as ItemRecord;
      if (typeof record.status === "string" && record.status) {
        unique.add(record.status);
      }
    }
    return Array.from(unique).sort();
  }, [items]);

  const theatersInSelectedCity = useMemo(() => {
    const selectedCityId = Number(listFilters.cityId || "");
    if (!Number.isFinite(selectedCityId) || selectedCityId <= 0) {
      return theaterOptions;
    }
    return theaterOptions.filter((theater) => theater.cityId === selectedCityId);
  }, [listFilters.cityId, theaterOptions]);

  const filteredItems = useMemo(() => {
    const search = normalizeText(listFilters.search || "").trim();

    return items.filter((item) => {
      const record = item as ItemRecord;

      if (moduleKey === "shows") {
        const selectedCityId = Number(listFilters.cityId || "");
        const selectedTheaterId = Number(listFilters.theaterId || "");
        const selectedMovieId = Number(listFilters.movieId || "");

        const theaterId = Number(record.theaterId || "");
        const movieId = Number(record.movieId || "");
        const screenId = Number(record.screenId || "");
        const theater = theaterById.get(theaterId);
        const movie = movieById.get(movieId);
        const screen = screenById.get(screenId);

        if (Number.isFinite(selectedCityId) && selectedCityId > 0 && theater?.cityId !== selectedCityId) {
          return false;
        }
        if (Number.isFinite(selectedTheaterId) && selectedTheaterId > 0 && theaterId !== selectedTheaterId) {
          return false;
        }
        if (Number.isFinite(selectedMovieId) && selectedMovieId > 0 && movieId !== selectedMovieId) {
          return false;
        }

        if (!search) return true;

        const searchable = [
          movie?.title,
          theater?.name,
          screen?.name,
          record.status,
          record.id,
          movieId,
          theaterId,
          screenId,
        ]
          .map((value) => normalizeText(value))
          .join(" ");

        return searchable.includes(search);
      }

      if (moduleKey === "theaters") {
        const selectedCityId = Number(listFilters.cityId || "");
        const cityId = Number(record.cityId || "");
        if (Number.isFinite(selectedCityId) && selectedCityId > 0 && cityId !== selectedCityId) {
          return false;
        }

        if (!search) return true;
        const searchable = [record.name, record.addressLine, cityNameById.get(cityId), record.pincode]
          .map((value) => normalizeText(value))
          .join(" ");
        return searchable.includes(search);
      }

      if (moduleKey === "screens") {
        const selectedCityId = Number(listFilters.cityId || "");
        const selectedTheaterId = Number(listFilters.theaterId || "");
        const theaterId = Number(record.theaterId || "");
        const theater = theaterById.get(theaterId);

        if (Number.isFinite(selectedCityId) && selectedCityId > 0 && theater?.cityId !== selectedCityId) {
          return false;
        }
        if (Number.isFinite(selectedTheaterId) && selectedTheaterId > 0 && theaterId !== selectedTheaterId) {
          return false;
        }

        if (!search) return true;
        const searchable = [record.name, record.screenType, theater?.name, record.id]
          .map((value) => normalizeText(value))
          .join(" ");
        return searchable.includes(search);
      }

      if (moduleKey === "movies") {
        if (!search) return true;
        const searchable = [record.title, record.language, record.genre, record.id]
          .map((value) => normalizeText(value))
          .join(" ");
        return searchable.includes(search);
      }

      if (moduleKey === "cities") {
        if (!search) return true;
        const searchable = [record.name, record.state, record.country, record.id]
          .map((value) => normalizeText(value))
          .join(" ");
        return searchable.includes(search);
      }

      if (moduleKey === "bookings") {
        const selectedStatus = listFilters.status || "";
        if (selectedStatus && String(record.status || "") !== selectedStatus) {
          return false;
        }

        if (!search) return true;

        const show = (record.show || {}) as ItemRecord;
        const movie = (show.movie || {}) as ItemRecord;
        const theater = (show.theater || {}) as ItemRecord;
        const screen = (show.screen || {}) as ItemRecord;
        const payment = (record.payment || {}) as ItemRecord;
        const seats = Array.isArray(record.seats) ? (record.seats as ItemRecord[]) : [];

        const seatLabels = seats
          .map((seat) => {
            const showSeat = (seat.showSeat || {}) as ItemRecord;
            const screenSeat = (showSeat.screenSeat || {}) as ItemRecord;
            return screenSeat.seatLabel;
          })
          .filter((value) => typeof value === "string");

        const userId = typeof record.userId === "string" ? record.userId : "";
        const user = userLookup[userId];

        const searchable = [
          user?.name,
          movie.title,
          theater.name,
          screen.name,
          record.status,
          payment.status,
          ...seatLabels,
        ]
          .map((value) => normalizeText(value))
          .join(" ");

        return searchable.includes(search);
      }

      if (!search) return true;
      const searchable = Object.values(record)
        .map((value) => normalizeText(value))
        .join(" ");
      return searchable.includes(search);
    });
  }, [
    cityNameById,
    items,
    listFilters.cityId,
    listFilters.movieId,
    listFilters.search,
    listFilters.status,
    listFilters.theaterId,
    moduleKey,
    movieById,
    screenById,
    theaterById,
    userLookup,
  ]);

  const handleFilterChange = (key: string, value: string) => {
    setListFilters((previous) => {
      const next = { ...previous, [key]: value };

      if (key === "cityId") {
        next.theaterId = "";
      }

      return next;
    });
  };

  const clearFilters = () => {
    setListFilters({});
  };

  return (
    <div className="space-y-8">
      {successMessage && !showForm ? (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-semibold">
          {successMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">{moduleConfig.label}</h2>
          <p className="text-on-surface-variant mt-1">{moduleConfig.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadItems()}
            className="clay-button-secondary px-4 py-2 rounded-xl text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Refresh
          </button>
          {moduleConfig.createEnabled && (
            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  handleCancelEdit();
                } else {
                  setShowForm(true);
                }
              }}
              className="clay-button-primary px-4 py-2 rounded-xl text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {showForm ? "Back to List" : `Create ${moduleConfig.label.slice(0, -1)}`}
            </button>
          )}
        </div>
      </div>

      {showForm && moduleConfig.createEnabled ? (
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
                <label className="text-sm font-semibold text-on-surface">Start Time</label>
                <input
                  type="datetime-local"
                  value={formState.startTime || ""}
                  onChange={(event) => handleInputChange("startTime", event.target.value)}
                  min={selectedShowMovie ? toDateTimeLocalInputValue(selectedShowMovie.releaseDate) : undefined}
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
                />
                {selectedShowMovie ? (
                  <p className="text-xs text-on-surface-variant">
                    Movie releases on {formatReleaseDateForAdmin(selectedShowMovie.releaseDate)}.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">End Time</label>
                <input
                  type="datetime-local"
                  value={formState.endTime || ""}
                  readOnly
                  className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none opacity-80"
                />
                <p className="text-xs text-on-surface-variant">Auto-calculated as movie duration + 20 min interval</p>
              </div>

              <div className="md:col-span-2 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-on-surface">Theater and Screen Assignments</h4>
                  <button
                    type="button"
                    onClick={() => setShowAssignments((previous) => [...previous, createEmptyShowAssignment()])}
                    className="clay-button-secondary px-3 py-2 rounded-lg text-xs font-bold"
                  >
                    Add Theater/Screen
                  </button>
                </div>

                <div className="space-y-3">
                  {showAssignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="bg-surface-container-low rounded-xl p-3 space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-on-surface-variant">Theater</label>
                          <select
                            value={assignment.theaterId}
                            onChange={(event) => {
                              const nextTheaterId = event.target.value;
                              setShowAssignments((previous) =>
                                previous.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? {
                                        ...row,
                                        theaterId: nextTheaterId,
                                        screenId: "",
                                        seatTypePrices: {},
                                        availableSeatTypes: [],
                                        loadingSeatTypes: false,
                                      }
                                    : row,
                                ),
                              );
                            }}
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
                            onChange={(event) => {
                              const nextScreenId = event.target.value;
                              setShowAssignments((previous) =>
                                previous.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? {
                                        ...row,
                                        screenId: nextScreenId,
                                        seatTypePrices: {},
                                        availableSeatTypes: [],
                                        loadingSeatTypes: Boolean(nextScreenId),
                                      }
                                    : row,
                                ),
                              );

                              if (nextScreenId) {
                                void loadSeatTypesForAssignment(index, nextScreenId);
                              }
                            }}
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

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-on-surface-variant">Seat Type Pricing</p>
                        {assignment.loadingSeatTypes ? (
                          <p className="text-xs text-on-surface-variant">Loading seat types...</p>
                        ) : assignment.availableSeatTypes.length === 0 ? (
                          <p className="text-xs text-on-surface-variant">
                            {assignment.screenId
                              ? "No active seat types found for selected screen."
                              : "Choose a screen to enter pricing."}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {assignment.availableSeatTypes.map((seatType) => (
                              <div key={seatType} className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-on-surface-variant">
                                  {seatTypeLabelMap[seatType]} Price
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="250"
                                  value={assignment.seatTypePrices[seatType] || ""}
                                  onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setShowAssignments((previous) =>
                                      previous.map((row, rowIndex) =>
                                        rowIndex === index
                                          ? {
                                              ...row,
                                              seatTypePrices: {
                                                ...row.seatTypePrices,
                                                [seatType]: nextValue,
                                              },
                                            }
                                          : row,
                                      ),
                                    );
                                  }}
                                  className="rounded-lg px-3 py-2 bg-surface border border-surface-container-high outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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

          {isScreensModule ? (
            (() => {
              const reg = Number(formState.regularRows) || 0;
              const premium = Number(formState.premiumRows) || 0;
              const rec = Number(formState.reclinerRows) || 0;
              const cols = Number(formState.totalCols) || 0;
              const cap = (reg + premium) * cols + rec * Math.floor(cols / 2);

              return (
                <div className="md:col-span-2 mt-4 space-y-4 border-t border-surface-container-high/60 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Screen Layout Preview</h4>
                      <p className="text-xs text-on-surface-variant">Configure rows and columns to generate the screen seating manifest.</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-on-surface-variant">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-t-sm rounded-b-sm bg-blue-500/80"></div> Basic</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-t-sm rounded-b-sm bg-rose-500/80"></div> Premium</div>
                        <div className="flex items-center gap-1"><div className="w-5 h-3 rounded-t-sm rounded-b-sm bg-amber-500/80"></div> Recliner</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                      Capacity: {cap} seats
                    </div>
                  </div>
                  
                  <SeatLayoutPreview 
                    regularRows={reg} 
                    premiumRows={premium} 
                    reclinerRows={rec} 
                    totalCols={cols} 
                    seatTypePrices={{
                      REGULAR: formState.basePrice,
                      PREMIUM: formState.premiumPrice,
                      RECLINER: formState.reclinerPrice,
                    }}
                  />
                </div>
              );
            })()
          ) : null}

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
              {isSubmitting ? "Saving..." : isAnyPosterUploading ? "Uploading images..." : editingItemId ? `Update ${moduleConfig.label.slice(0, -1)}` : `Create ${moduleConfig.label.slice(0, -1)}`}
            </button>
            {successMessage ? <span className="text-sm text-green-700 font-semibold">{successMessage}</span> : null}
          </div>
        </form>
      ) : null}

      {error ? <p className="text-sm font-semibold text-red-500">{error}</p> : null}

      {!showForm ? (
        <section className="space-y-4">
          <div className="clay-inset rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <input
              type="text"
              value={listFilters.search || ""}
              onChange={(event) => handleFilterChange("search", event.target.value)}
              placeholder="Search records"
              className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
            />

            {moduleKey === "shows" || moduleKey === "theaters" || moduleKey === "screens" ? (
              <select
                value={listFilters.cityId || ""}
                onChange={(event) => handleFilterChange("cityId", event.target.value)}
                className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
              >
                <option value="">All Cities</option>
                {cityOptions.map((city) => (
                  <option key={city.id} value={String(city.id)}>
                    {city.name}
                  </option>
                ))}
              </select>
            ) : null}

            {moduleKey === "shows" || moduleKey === "screens" ? (
              <select
                value={listFilters.theaterId || ""}
                onChange={(event) => handleFilterChange("theaterId", event.target.value)}
                className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
              >
                <option value="">All Theaters</option>
                {theatersInSelectedCity.map((theater) => (
                  <option key={theater.id} value={String(theater.id)}>
                    {theater.name}
                  </option>
                ))}
              </select>
            ) : null}

            {moduleKey === "shows" ? (
              <select
                value={listFilters.movieId || ""}
                onChange={(event) => handleFilterChange("movieId", event.target.value)}
                className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
              >
                <option value="">All Movies</option>
                {movieOptions.map((movie) => (
                  <option key={movie.id} value={String(movie.id)}>
                    {movie.title}
                  </option>
                ))}
              </select>
            ) : null}

            {moduleKey === "bookings" ? (
              <select
                value={listFilters.status || ""}
                onChange={(event) => handleFilterChange("status", event.target.value)}
                className="rounded-xl px-3 py-2 bg-surface-container-low border border-surface-container-high outline-none"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : null}

            <button
              type="button"
              onClick={clearFilters}
              className="clay-button-secondary px-4 py-2 rounded-xl text-sm font-bold"
            >
              Clear Filters
            </button>
          </div>

          {isLoading ? (
            <p className="text-on-surface-variant">Loading records...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-on-surface-variant">
              {Object.values(listFilters).some((value) => Boolean(value && value.trim()))
                ? "No records match the applied filters."
                : "No records found yet."}
            </p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredItems.map((item, index) => {
                const record = (item as ItemRecord) || {};

                if (moduleKey === "bookings") {
                  const show = (record.show || {}) as ItemRecord;
                  const movie = (show.movie || {}) as ItemRecord;
                  const theater = (show.theater || {}) as ItemRecord;
                  const screen = (show.screen || {}) as ItemRecord;
                  const payment = (record.payment || {}) as ItemRecord;
                  const seats = Array.isArray(record.seats) ? (record.seats as ItemRecord[]) : [];

                  const seatLabels = seats
                    .map((seat) => {
                      const showSeat = (seat.showSeat || {}) as ItemRecord;
                      const screenSeat = (showSeat.screenSeat || {}) as ItemRecord;
                      return typeof screenSeat.seatLabel === "string" ? screenSeat.seatLabel : "";
                    })
                    .filter(Boolean)
                    .join(", ");

                  const userId = typeof record.userId === "string" ? record.userId : "";
                  const user = userLookup[userId];
                  const userName = user?.name || "Unknown User";

                  return (
                    <article
                      key={index}
                      className="clay-inset rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_16px_#c3c3c3,-8px_-8px_16px_#fdfdfd] hover:bg-surface-container-low space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-surface-container-high/60 pb-3">
                        <div>
                          <h4 className="font-bold text-on-surface text-lg">
                            {typeof movie.title === "string" ? movie.title : "Movie"}
                          </h4>
                          <p className="text-sm text-on-surface-variant">
                            {typeof theater.name === "string" ? theater.name : "Theater"}
                            {typeof screen.name === "string" ? ` • ${screen.name}` : ""}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface-container-low text-on-surface-variant">
                          {typeof record.status === "string" ? record.status : "PENDING"}
                        </span>
                      </div>

                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-surface-container-low rounded-lg px-3 py-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Customer</dt>
                          <dd className="text-sm font-medium text-on-surface mt-1">{userName}</dd>
                        </div>
                        <div className="bg-surface-container-low rounded-lg px-3 py-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Show Time</dt>
                          <dd className="text-sm font-medium text-on-surface mt-1">{formatDateTime(show.startTime)}</dd>
                        </div>
                        <div className="bg-surface-container-low rounded-lg px-3 py-2 md:col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Seats</dt>
                          <dd className="text-sm font-medium text-on-surface mt-1">{seatLabels || "N/A"}</dd>
                        </div>
                        <div className="bg-surface-container-low rounded-lg px-3 py-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Payment Status</dt>
                          <dd className="text-sm font-medium text-on-surface mt-1">
                            {typeof payment.status === "string" ? payment.status : "N/A"}
                          </dd>
                        </div>
                        <div className="bg-surface-container-low rounded-lg px-3 py-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount</dt>
                          <dd className="text-sm font-medium text-on-surface mt-1">
                            {formatAmountINR(record.totalAmount ?? payment.amount)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  );
                }

                const preferredFields = moduleFieldMap[moduleConfig.key];
                const fields = preferredFields.filter((field) => field in record);

                const textFields = fields.filter((f) => f !== "posterVerticalUrl" && f !== "posterHorizontalUrl");
                const mediaFields = fields.filter((f) => f === "posterVerticalUrl" || f === "posterHorizontalUrl");

                return (
                  <div 
                    key={index} 
                    className="clay-inset rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_16px_#c3c3c3,-8px_-8px_16px_#fdfdfd] hover:bg-surface-container-low group flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-surface-container-high/60 pb-3">
                      <div className="flex items-center gap-3">
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
                      <div className="flex items-center gap-2">
                        {moduleConfig.createEnabled && (
                          <button
                            type="button"
                            onClick={() => handleEditRequest(record)}
                            className="text-primary hover:bg-primary/10 px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {moduleConfig.deleteEnabled && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteRequest(record)}
                            disabled={deletingItemId === record.id}
                            className="text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                          >
                            {deletingItemId === record.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>

                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {textFields.map((field) => (
                        <div key={field} className="bg-surface-container-low rounded-lg px-3 py-2 self-start">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                            {toTitleCase(field)}
                          </dt>
                          <dd className="text-sm font-medium text-on-surface mt-1">{formatValue(record[field])}</dd>
                        </div>
                      ))}
                    </dl>

                    {mediaFields.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-surface-container-high/60">
                        {mediaFields.map((field) => (
                          <div key={field} className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                              {field === "posterVerticalUrl" ? "Vertical Poster" : "Horizontal Poster"}
                            </span>
                            <div
                              className={`overflow-hidden rounded-lg border border-surface-container-high bg-surface ${
                                field === "posterVerticalUrl" ? "w-32 sm:w-40 aspect-2/3" : "w-full aspect-video"
                              } self-start`}
                            >
                              <img
                                src={record[field] as string}
                                alt={`${field === "posterVerticalUrl" ? "Vertical" : "Horizontal"} poster`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
