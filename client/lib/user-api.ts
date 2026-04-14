const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  error: unknown;
};

type ShowStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";
type SeatType = "REGULAR" | "COUPLE" | "RECLINER";
type SeatBookingStatus = "AVAILABLE" | "LOCKED" | "BOOKED";
type BookingStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

type MovieSummary = {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  language: string;
  genre: string;
  releaseDate: string;
  posterVerticalUrl: string | null;
  posterHorizontalUrl: string | null;
};

type ShowSummary = {
  id: number;
  startTime: string;
  endTime: string;
  basePrice: string;
  pricingProfile: unknown;
  status: ShowStatus;
  movie: {
    id: number;
    title: string;
    durationMinutes: number;
    genre: string;
    language: string;
    posterHorizontalUrl: string | null;
    posterVerticalUrl: string | null;
  };
  theater: {
    id: number;
    name: string;
    cityId: number;
    addressLine: string;
  };
  screen: {
    id: number;
    name: string;
    screenType: string;
  };
};

type ShowSeatRecord = {
  id: number;
  showId: number;
  screenSeatId: number;
  price: string;
  status: SeatBookingStatus;
  lockedUntil: string | null;
  screenSeat: {
    id: number;
    rowLabel: string;
    seatNumber: number;
    seatLabel: string;
    seatType: SeatType;
  };
};

type PublicShowSeatMap = {
  id: number;
  startTime: string;
  endTime: string;
  basePrice: string;
  pricingProfile: unknown;
  movie: {
    id: number;
    title: string;
    durationMinutes: number;
    language: string;
    genre: string;
    posterHorizontalUrl: string | null;
    posterVerticalUrl: string | null;
  };
  theater: {
    id: number;
    name: string;
    cityId: number;
    addressLine: string;
  };
  screen: {
    id: number;
    name: string;
    screenType: string;
    totalRows: number;
    totalCols: number;
    layoutProfile: unknown;
  };
  seats: ShowSeatRecord[];
};

type BookingSeat = {
  id: number;
  showSeatId: number;
  price: string;
  showSeat: {
    id: number;
    screenSeat: {
      seatLabel: string;
      seatType: SeatType;
      rowLabel: string;
      seatNumber: number;
    };
  };
};

type BookingDetails = {
  id: string;
  userId: string;
  showId: number;
  status: BookingStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  seatHoldExpiresAt?: string;
  show: {
    id: number;
    startTime: string;
    endTime: string;
    status: ShowStatus;
    movie: {
      id: number;
      title: string;
      language: string;
      genre: string;
      posterHorizontalUrl: string | null;
      posterVerticalUrl: string | null;
    };
    theater: {
      id: number;
      name: string;
      addressLine: string;
      cityId: number;
    };
    screen: {
      id: number;
      name: string;
      screenType: string;
    };
  };
  seats: BookingSeat[];
  payment: {
    id: string;
    status: "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED";
    amount: string;
    currency: string;
    provider: string;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
  } | null;
};

export class UserApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new UserApiError("Invalid server response");
  }

  if (!response.ok || !payload.success) {
    throw new UserApiError(payload.message || "Request failed");
  }

  return payload;
}

function buildAuthHeaders(accessToken?: string | null) {
  if (!accessToken) return undefined;

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchPublicMovies(search = ""): Promise<MovieSummary[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`${API_BASE_URL}/movies/public${query}`, {
    cache: "no-store",
  });

  const parsed = await parseResponse<MovieSummary[]>(response);
  return parsed.data || [];
}

export async function fetchPublicMovieDetails(movieId: number): Promise<MovieSummary> {
  const response = await fetch(`${API_BASE_URL}/movies/public/${movieId}`, {
    cache: "no-store",
  });

  const parsed = await parseResponse<MovieSummary>(response);
  if (!parsed.data) {
    throw new UserApiError("Movie not found");
  }

  return parsed.data;
}

export async function fetchPublicShows(params: {
  movieId?: number;
  theaterId?: number;
  screenId?: number;
}): Promise<ShowSummary[]> {
  const searchParams = new URLSearchParams();
  if (params.movieId) searchParams.set("movieId", String(params.movieId));
  if (params.theaterId) searchParams.set("theaterId", String(params.theaterId));
  if (params.screenId) searchParams.set("screenId", String(params.screenId));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/shows/public${query}`, {
    cache: "no-store",
  });

  const parsed = await parseResponse<ShowSummary[]>(response);
  return parsed.data || [];
}

export async function fetchPublicShowSeatMap(showId: number): Promise<PublicShowSeatMap> {
  const response = await fetch(`${API_BASE_URL}/shows/public/${showId}/seats`, {
    cache: "no-store",
  });

  const parsed = await parseResponse<PublicShowSeatMap>(response);
  if (!parsed.data) {
    throw new UserApiError("Show not found");
  }

  return parsed.data;
}

export async function createBooking(
  accessToken: string,
  payload: { showId: number; showSeatIds: number[] },
): Promise<BookingDetails> {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const parsed = await parseResponse<BookingDetails>(response);
  if (!parsed.data) {
    throw new UserApiError("Booking could not be created");
  }

  return parsed.data;
}

export async function completeBookingPayment(
  accessToken: string,
  bookingId: string,
  success: boolean,
): Promise<BookingDetails> {
  const response = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify({
      success,
      paymentId: success ? `demo_${Date.now()}` : undefined,
    }),
    cache: "no-store",
  });

  const parsed = await parseResponse<BookingDetails>(response);
  if (!parsed.data) {
    throw new UserApiError("Payment could not be processed");
  }

  return parsed.data;
}

export async function createRazorpayOrder(
  accessToken: string,
  bookingId: string,
): Promise<{ keyId: string; orderId: string; amount: number; currency: string; bookingId: string }> {
  const response = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}/razorpay-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    credentials: "include",
    cache: "no-store",
  });

  const parsed = await parseResponse<{
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    bookingId: string;
  }>(response);

  if (!parsed.data) {
    throw new UserApiError("Failed to create Razorpay order");
  }

  return parsed.data;
}

export async function verifyRazorpayPayment(
  accessToken: string,
  bookingId: string,
  payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
): Promise<BookingDetails> {
  const response = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}/razorpay-verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse<BookingDetails>(response);
  if (!parsed.data) {
    throw new UserApiError("Failed to verify Razorpay payment");
  }

  return parsed.data;
}

export async function fetchMyBookings(accessToken: string): Promise<BookingDetails[]> {
  const response = await fetch(`${API_BASE_URL}/bookings/me`, {
    headers: {
      ...buildAuthHeaders(accessToken),
    },
    cache: "no-store",
  });

  const parsed = await parseResponse<BookingDetails[]>(response);
  return parsed.data || [];
}

export async function fetchBookingDetails(accessToken: string, bookingId: string): Promise<BookingDetails> {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    headers: {
      ...buildAuthHeaders(accessToken),
    },
    cache: "no-store",
  });

  const parsed = await parseResponse<BookingDetails>(response);
  if (!parsed.data) {
    throw new UserApiError("Booking not found");
  }

  return parsed.data;
}

export type {
  BookingDetails,
  MovieSummary,
  PublicShowSeatMap,
  SeatBookingStatus,
  ShowSeatRecord,
  ShowSummary,
};
