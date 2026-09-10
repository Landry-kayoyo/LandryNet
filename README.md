# Landry Net — Portfolio IT

Portfolio personnel de Landry Kayoyo, dédié à l'administration systèmes et réseaux, à l'infrastructure haute disponibilité, au monitoring et au développement.

## Démarrage local

### Prérequis

- Node.js 22 ou plus récent
- pnpm 11 (`corepack enable` puis `corepack prepare pnpm@11.21.0 --activate`)

### Installation

Depuis la racine du projet :

```bash
pnpm install
```

Copier `.env.example` vers `.env` et renseigner les variables SMTP uniquement si l’envoi d’e-mails est nécessaire. SQLite est utilisé automatiquement en développement, sans serveur de base de données externe.

### Démarrer le portfolio

```bash
pnpm run dev:web
```

Ouvrir [http://localhost:5173](http://localhost:5173).

### Démarrer l’API

Dans un deuxième terminal :

```bash
pnpm run dev:api
```

L’API écoute sur le port `5000`. Vérifier son état avec [http://localhost:5000/api/healthz](http://localhost:5000/api/healthz).

### Vérifier le projet

```bash
pnpm run typecheck
pnpm run build
```

### Base de données

- SQLite local : `./data/landry-net.sqlite`.
- Modifier le chemin avec `SQLITE_PATH`.
- Vercel + Neon : définir `DB_DRIVER=postgres` et `DATABASE_URL` dans les variables Vercel, puis lancer `pnpm run db:migrate:postgres` depuis un environnement qui possède ces variables.
- Le fichier `.env.vercel.example` contient les variables spécifiques au déploiement Vercel. Ne jamais mettre la vraie `DATABASE_URL` dans Git.
- Schéma local : `pnpm run db:migrate`.

### Commandes workspace

- `pnpm --filter @workspace/api-spec run codegen` — régénérer le client API et les schémas Zod depuis OpenAPI.
- `pnpm --filter @workspace/web run serve` — prévisualiser le build web.

- `pnpm --filter @workspace/landry-net-portfolio run dev` — run the portfolio web app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Local default: SQLite at `./data/landry-net.sqlite` (no database service required)
- PostgreSQL: set `DB_DRIVER=postgres` and `DATABASE_URL`, then run `pnpm run db:migrate:postgres`
- Optional: `SQLITE_PATH` changes the local SQLite file location
- Copy `.env.example` to `.env` and replace the placeholder values before starting the API.

### Déploiement Vercel / Neon

Le frontend et l’API peuvent être déployés dans le même projet Vercel. Le fichier `vercel.json` publie `apps/web/dist/public`, redirige `/api/*` vers la fonction `api/index.ts` et exécute automatiquement `pnpm run db:migrate:postgres` avant chaque build.

Dans Vercel, définir au minimum `NODE_ENV=production`, `DB_DRIVER=postgres`, `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `VITE_API_URL=/api`. Exécuter ensuite `pnpm run db:migrate:postgres` avec la même `DATABASE_URL` pour créer le schéma Neon.

SQLite reste réservé au développement local. Une base SQLite sur Vercel ne doit pas être utilisée comme stockage de production: le système de fichiers des fonctions est éphémère et les données peuvent disparaître entre deux exécutions.

### Contact email

The contact form saves each message in the admin inbox and sends an email when SMTP is configured. Set these API environment variables:

```text
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-account@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-account@example.com
CONTACT_EMAIL=hello@example.com
```

For Gmail or another provider with two-factor authentication, use an app password instead of the account password. Without SMTP variables, messages remain safely stored in the admin inbox and the API returns a configuration error instead of claiming delivery.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: SQLite locally, PostgreSQL-ready + Drizzle ORM
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
- Le formulaire enregistre les messages via l'API et envoie un e-mail via SMTP; aucune fausse confirmation de livraison n'est affichée si l'envoi échoue.

## Product

- Présentation de Landry Net et de son approche de l'infrastructure IT
- Expertise interactive sur les systèmes, réseaux, monitoring, infrastructure et développement
- Cas d'étude visuel sur la haute disponibilité Windows Server
- Parcours, stack technique et formulaire de prise de contact

## User preferences

- L'interface doit rester premium, professionnelle et inspirée de la référence Figma fournie par l'utilisateur.

## Gotchas

- Vite utilise `PORT=5173` et `BASE_PATH=/` par défaut en local.
- `DATABASE_URL` est requis uniquement avec `DB_DRIVER=postgres`; SQLite est utilisé par défaut.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
