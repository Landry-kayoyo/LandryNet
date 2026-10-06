import { Router } from "express";
import { getPublicCmsData, getPublicDocument } from "@workspace/db";

const router = Router();
router.get("/documents/:id", async (req: any, res: any, next: any) => {
	try {
		if (!/^\d+$/.test(String(req.params.id))) {
			res.status(404).end();
			return;
		}
		const document = await getPublicDocument(String(req.params.id));
		if (!document) {
			res.status(404).end();
			return;
		}
		res.setHeader("Content-Type", document.content_type);
		res.setHeader("Content-Disposition", `inline; filename="${document.file_name.replace(/[\r\n"]+/g, "_")}"`);
		res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
		res.send(document.data);
	} catch (error) { next(error); }
});
router.get("/content", async (_req: any, res: any, next: any) => {
	try { res.json(await getPublicCmsData()); } catch (error) { next(error); }
});
export default router;