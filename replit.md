# Landry Net — Portfolio IT

Portfolio personnel de Landry Kayoyo, dédié à l'administration systèmes et réseaux, à l'infrastructure haute disponibilité, au monitoring et au développement.

## Run & Operate

- `pnpm --filter @workspace/landry-net-portfolio run dev` — run the portfolio web app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/landry-net-portfolio/src/App.tsx` — page portfolio, navigation, sections et formulaire de contact
- `artifacts/landry-net-portfolio/src/index.css` — direction visuelle, responsive et animations
- `attached_assets/` — logo Landry Net et photos utilisées par le portfolio
- `lib/db/src/schema/` — schéma source de la base PostgreSQL
- `lib/api-spec/` — contrat OpenAPI source

## Architecture decisions

- Le portfolio est une single-page indépendante de l'API afin de rester rapide à consulter et facile à partager.
- La page utilise une palette sombre éditoriale avec des accents bleu électrique et vert citron dérivés du logo.
- Les interactions de la page restent côté client ; le formulaire conserve actuellement un brouillon local pour fournir un retour immédiat sans inventer de service d'envoi.

## Product

- Présentation de Landry Net et de son approche de l'infrastructure IT
- Expertise interactive sur les systèmes, réseaux, monitoring, infrastructure et développement
- Cas d'étude visuel sur la haute disponibilité Windows Server
- Parcours, stack technique et formulaire de prise de contact

## User preferences

- L'interface doit rester premium, professionnelle et inspirée de la référence Figma fournie par l'utilisateur.

## Gotchas

- Les commandes Vite de ce monorepo attendent `PORT` et `BASE_PATH` lorsqu'elles sont lancées directement hors workflow.
- `DATABASE_URL` est requis uniquement par le serveur API et n'est pas nécessaire pour afficher le portfolio.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
