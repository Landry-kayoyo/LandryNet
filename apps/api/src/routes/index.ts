import { Router, type IRouter } from "express";
import contactRouter from "./contact";
import healthRouter from "./health";
import adminRouter from "./admin";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use("/admin", adminRouter);
router.use(publicRouter);

export default router;
