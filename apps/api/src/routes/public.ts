import { Router } from "express";
import { getPublicCmsData } from "@workspace/db";

const router = Router();
router.get("/content", async (_req: any, res: any, next: any) => {
	try { res.json(await getPublicCmsData()); } catch (error) { next(error); }
});
export default router;