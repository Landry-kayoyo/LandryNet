import { Router } from "express";
import { getPublicCmsData } from "@workspace/db";

const router = Router();

const SITE_URL = process.env.VITE_SITE_URL || "https://landrynet.vercel.app";

function resolvePublicImageUrl(image: unknown): string | null {
  if (typeof image !== "string" || !image.trim() || image.startsWith("data:")) return null;
  try {
    return new URL(image, `${SITE_URL.replace(/\/+$/, "")}/`).toString();
  } catch {
    return null;
  }
}

// Default OG data per static route
const STATIC_ROUTES: Record<string, { title: string; description: string; image: string }> = {
  "/": {
    title: "Landry Kayoyo | Administrateur systèmes et réseaux",
    description:
      "Portfolio de Landry Kayoyo, administrateur systèmes et réseaux, infrastructure IT, sécurité et monitoring.",
    image: `${SITE_URL}/og-cover.jpg`,
  },
  "/a-propos": {
    title: "À propos | Landry Kayoyo",
    description:
      "Découvrez le profil de Landry Kayoyo : infrastructure IT, systèmes, réseaux et sécurité informatique.",
    image: `${SITE_URL}/og-about.jpg`,
  },
  "/services": {
    title: "Services | Landry Kayoyo",
    description:
      "Les services proposés par Landry Kayoyo : administration systèmes, réseaux, monitoring et sécurité.",
    image: `${SITE_URL}/og-cover.jpg`,
  },
  "/projets": {
    title: "Publications & Projets | Landry Kayoyo",
    description:
      "Consultez les projets et réalisations de Landry Kayoyo dans les domaines des systèmes, réseaux et infrastructure.",
    image: `${SITE_URL}/og-cover.jpg`,
  },
};

/**
 * GET /api/og?path=/publication/3
 * Returns the OG metadata (title, description, image) for a given path.
 * Used server-side to generate the correct meta tags for social crawlers.
 */
router.get("/og", async (req: any, res: any) => {
  const path = (req.query.path as string) || "/";

  // 1. Check static routes first
  if (STATIC_ROUTES[path]) {
    return res.json(STATIC_ROUTES[path]);
  }

  // 2. Dynamic project/publication route: /publication/:id
  const publicationMatch = path.match(/^\/publication\/(.+)$/);
  if (publicationMatch) {
    const id = publicationMatch[1];
    try {
      const data = await getPublicCmsData();
      const project = data.projects.find((p: any) => String(p.id) === String(id));
      if (project) {
        const coverImage = resolvePublicImageUrl(project.data.coverImage) ?? `${SITE_URL}/og-cover.jpg`;
        return res.json({
          title: `${project.title} | Landry Kayoyo`,
          description:
            typeof project.data.description === "string"
              ? project.data.description
              : "Projet de Landry Kayoyo — infrastructure IT, réseaux et systèmes.",
          image: coverImage,
        });
      }
    } catch (_err) {
      // fall through to default
    }
  }

  // 3. Fallback to home defaults
  return res.json(STATIC_ROUTES["/"]);
});

export default router;
