import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { loginSchema, registerAdminSchema, registerSchema } from "./auth.validation.js";
import { login, logout, me, refresh, register, registerAdmin } from "./auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/register-admin", validate(registerAdminSchema), registerAdmin);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
