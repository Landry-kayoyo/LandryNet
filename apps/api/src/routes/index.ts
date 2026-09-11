import { Router } from "express";
import contactRouter from "./contact.js";
import healthRouter from "./health.js";
import adminRouter from "./admin.js";
import publicRouter from "./public.js";

const router = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use("/admin", adminRouter);
router.use(publicRouter);

export default router;
