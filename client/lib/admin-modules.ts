export type AdminModuleKey =
  | "cities"
  | "theaters"
  | "screens"
  | "movies"
  | "shows"
  | "users"
  | "bookings"
  | "payments";

export type ModuleField = {
  key: string;
  label: string;
  type: "text" | "number" | "datetime-local" | "select";
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

export type AdminModuleConfig = {
  key: AdminModuleKey;
  label: string;
  description: string;
  path: string;
  createEnabled: boolean;
  fields: ModuleField[];
};

export const ADMIN_MODULES: AdminModuleConfig[] = [
  {
    key: "cities",
    label: "Cities",
    description: "Add cities where your platform is available.",
    path: "/cities",
    createEnabled: true,
    fields: [
      { key: "name", label: "City Name", type: "text", placeholder: "Mumbai" },
      { key: "state", label: "State", type: "text", placeholder: "Maharashtra" },
      { key: "country", label: "Country", type: "text", placeholder: "India" },
    ],
  },
  {
    key: "theaters",
    label: "Theaters",
    description: "Create cinema theaters in a selected city.",
    path: "/theaters",
    createEnabled: true,
    fields: [
      { key: "cityId", label: "City ID", type: "number", placeholder: "1" },
      { key: "name", label: "Theater Name", type: "text", placeholder: "PVR Nexus" },
      { key: "addressLine", label: "Address", type: "text", placeholder: "Main Road, Area" },
      { key: "pincode", label: "Pincode", type: "text", placeholder: "400001" },
    ],
  },
  {
    key: "screens",
    label: "Screens",
    description: "Add screens/audi and define size/type for each theater.",
    path: "/screens",
    createEnabled: true,
    fields: [
      { key: "theaterId", label: "Theater ID", type: "number", placeholder: "1" },
      { key: "name", label: "Screen Name", type: "text", placeholder: "Audi 1" },
      {
        key: "screenType",
        label: "Screen Type",
        type: "select",
        options: [
          { label: "Elite (IMAX)", value: "ELITE" },
          { label: "Premium (Big Screen)", value: "PREMIUM" },
          { label: "Normal (Small Screen)", value: "NORMAL" },
        ],
      },
      { key: "totalCols", label: "Columns (Width)", type: "number", placeholder: "18" },
      { key: "regularRows", label: "Basic Rows (Front)", type: "number", placeholder: "5" },
      { key: "coupleRows", label: "Premium Rows (Middle)", type: "number", placeholder: "5" },
      { key: "reclinerRows", label: "Recliner Rows (Back)", type: "number", placeholder: "2" },
    ],
  },
  {
    key: "movies",
    label: "Movies",
    description: "Create and publish movie metadata for booking.",
    path: "/movies",
    createEnabled: true,
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "Dhurandhar: The Revenge" },
      { key: "description", label: "Description", type: "text", placeholder: "Movie description" },
      { key: "durationMinutes", label: "Duration (minutes)", type: "number", placeholder: "145" },
      { key: "language", label: "Language", type: "text", placeholder: "Hindi" },
      { key: "genre", label: "Genre", type: "text", placeholder: "Action" },
      { key: "releaseDate", label: "Release Date", type: "datetime-local" },
    ],
  },
  {
    key: "shows",
    label: "Shows",
    description: "Assign movies to theaters/screens with timeslots.",
    path: "/shows",
    createEnabled: true,
    fields: [
      { key: "movieId", label: "Movie ID", type: "number", placeholder: "1" },
      { key: "theaterId", label: "Theater ID", type: "number", placeholder: "1" },
      { key: "screenId", label: "Screen ID", type: "number", placeholder: "1" },
      { key: "startTime", label: "Start Time", type: "datetime-local" },
      { key: "endTime", label: "End Time", type: "datetime-local" },
      { key: "basePrice", label: "Basic Price", type: "number", placeholder: "250" },
      { key: "couplePrice", label: "Premium Price", type: "number", placeholder: "350" },
      { key: "reclinerPrice", label: "Recliner Price", type: "number", placeholder: "500" },
    ],
  },
  {
    key: "users",
    label: "Users",
    description: "View registered users.",
    path: "/users",
    createEnabled: false,
    fields: [],
  },
  {
    key: "bookings",
    label: "Bookings",
    description: "Track ticket bookings.",
    path: "/bookings",
    createEnabled: false,
    fields: [],
  },
  {
    key: "payments",
    label: "Payments",
    description: "Monitor payment records.",
    path: "/payments",
    createEnabled: false,
    fields: [],
  },
];

export function getAdminModuleByKey(key: string) {
  return ADMIN_MODULES.find((moduleConfig) => moduleConfig.key === key);
}
