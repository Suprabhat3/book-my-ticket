import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { getPaymentsPlaceholder } from "./payments.controller.js";

const router = Router();

router.get("/", requireAuth, getPaymentsPlaceholder);

export default router;
