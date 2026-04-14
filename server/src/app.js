import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requireAuth, requireRole } from "./common/middlewares/auth.middleware.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";
import { notFoundMiddleware } from "./common/middlewares/not-found.middleware.js";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import citiesRoutes from "./modules/cities/cities.routes.js";
import theatersRoutes from "./modules/theaters/theaters.routes.js";
import screensRoutes from "./modules/screens/screens.routes.js";
import moviesRoutes from "./modules/movies/movies.routes.js";
import showsRoutes from "./modules/shows/shows.routes.js";
import bookingsRoutes from "./modules/bookings/bookings.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/cities", citiesRoutes);
app.use("/api/v1/theaters", theatersRoutes);
app.use("/api/v1/screens", screensRoutes);
app.use("/api/v1/movies", moviesRoutes);
app.use("/api/v1/shows", showsRoutes);
app.use("/api/v1/bookings", bookingsRoutes);
app.use("/api/v1/payments", paymentsRoutes);

app.get("/api/v1/admin/ping", requireAuth, requireRole("ADMIN"), (req, res) => {
  res.json({ success: true, message: "Admin access confirmed", data: null, error: null });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
