import { Router, type IRouter } from "express";
import { getPublicCmsData } from "@workspace/db";

const router: IRouter = Router();
router.get("/content", async (_req, res, next) => {
	try { res.json(await getPublicCmsData()); } catch (error) { next(error); }
});
export default router;