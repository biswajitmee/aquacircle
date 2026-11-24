# AquaCircle

Next.js App Router, TypeScript, Tailwind **3.4**, GSAP, React Hook Form and Zod. Prepared for Netlify, conventional Node.js and Docker hosting.

## Deploy on Netlify

1. In Netlify, import the GitHub repository `biswajitmee/aquacircle` and select branch `main`.
2. Keep the base directory at the repository root. `netlify.toml` supplies **build command `npm run build:netlify`**, **publish directory `.next`**, and **Node.js 22**. Netlify installs dependencies from `package-lock.json` and automatically uses its current Next.js adapter. Do not use a static export or drag-and-drop upload: bookings need the server API.
3. Before deployment, add the values listed in [`.env.netlify.example`](.env.netlify.example) under **Project configuration > Environment variables**. Make them available to **Builds and Functions** (or all scopes). The example deliberately contains no database or SMTP credentials. Do not import the local development `.env.local`: its local database and mail server cannot run on Netlify.
4. Set `SITE_URL` to the exact live HTTPS origin, without a trailing slash. Initially use your actual `https://YOUR-SITE.netlify.app` address; after connecting `aquacircle.in`, set `SITE_URL=https://aquacircle.in` and redeploy. It controls canonical URLs, sitemap links and accepted booking-request origins. Redirect other domains to this primary domain in Netlify.
5. Deploy. Open `/api/health` and check for HTTP 200 with `{"status":"ready"}`. Submit a test enquiry and confirm that the business inbox receives it; the health endpoint checks configuration/database connectivity, not actual SMTP delivery.

Required for working booking forms: a hosted **PostgreSQL** database with TLS, a real **SMTP** provider, a verified `EMAIL_FROM`, `BUSINESS_NOTIFICATION_EMAIL`, a private random `RATE_LIMIT_SECRET`, and `LOCAL_DEVELOPMENT=0`. Prefer the database provider's pooled connection string for serverless use. The application creates its tables/indexes on first connection, so the database role must have those permissions. Configure backups with the database provider. The public pages build without these secrets, but bookings return unavailable until they are configured.

Netlify runs `retry-enquiries` once a minute to recover one pending/failed notification per invocation, and `enquiry-retention` daily at 03:00 UTC to apply the existing retention policy. These replace the continuously running Node worker **on Netlify**. In Netlify's Functions panel, check that both schedules appear and use **Run now** to verify them after configuration. Scheduled executions run only for published deployments. Keep production credentials limited to the production deploy context; previews need separate test services if you want working forms there.

The existing server-rendered pages include titles/descriptions, canonical URLs, Open Graph metadata, local fonts, optimized images, `/robots.txt`, and `/sitemap.xml`. After connecting the final domain, verify that sitemap/canonical links use it and submit `/sitemap.xml` to Google Search Console. This preserves the site's SEO setup; search rankings are not guaranteed.

Official references: [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [runtime environment variables](https://docs.netlify.com/build/functions/environment-variables/), [scheduled functions](https://docs.netlify.com/build/functions/scheduled-functions/).

## What belongs in Git

| Keep in the repository | Reason |
| --- | --- |
| `src/`, including fonts and their license | Pages, styles, SEO metadata, booking APIs and application logic |
| `public/` | Optimized images served by the website |
| `package.json`, `package-lock.json`, `.nvmrc` | Reproducible dependencies and Node version |
| `next.config.ts`, `tsconfig.json`, Tailwind/PostCSS/ESLint configuration | Build configuration |
| `netlify.toml`, `netlify/functions/` | Netlify build and scheduled delivery/retention |
| `.env.example`, `.env.netlify.example` | Safe configuration templates only |
| `scripts/`, `tests/`, `docs/`, `README.md`, `AGENTS.md` | Development, validation and operational instructions |
| Docker files | Optional alternative hosting; Netlify does not use them |

`.gitignore` excludes `node_modules/`, `.next/`, `dist/`, `out/`, `.netlify/`, generated `next-env.d.ts`, TypeScript caches, real `.env*` files, `.data/`, logs, test reports, screenshots, editor state and raw `assets/` artwork. Netlify recreates build output; the optimized images in `public/` are sufficient to run the site. Ignored artwork and QA artifacts can remain on your computer. To regenerate images, restore your local `assets/` source artwork first; it is not needed for `npm ci` or a production build. Earlier Git history may still contain artwork or reports committed before this ignore policy.

## Local development

Use a maintained Node.js 22 LTS release (22.13 or newer recommended for the complete development toolchain).

```powershell
npm ci
Copy-Item .env.example .env.local
npm run mail:dev
```

In a second terminal:

```powershell
npm run dev
```

Website: http://localhost:3000. Local email capture: http://localhost:8025. Only synthetic test mail should be used with the development capture server; it sends nothing externally and its inbox is cleared when it stops.

The default development database is durable embedded PostgreSQL (PGlite), stored in ignored `.data/aquacircle`. It is owned by one web process. Stop that process before running an operations command against the same PGlite directory. Production uses real PostgreSQL through `pg`, with the same SQL schema, durable delivery status and transactional claims. A separate ORM is unnecessary for the two-table schema.

Optional Docker development dependencies:

```powershell
docker compose -f compose.local.yaml up -d
```

This starts PostgreSQL and Mailpit. Stop `npm run mail:dev` first to free ports 1025 and 8025. Set `DATABASE_URL=postgresql://aquacircle:local-development-only@localhost:5432/aquacircle` in `.env.local` to use this database. Do not run multiple web/worker processes against a PGlite directory.

## Checks and build

```powershell
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

Browser tests require the local SMTP capture service running. Playwright starts/reuses the dev server. `PLAYWRIGHT_BASE_URL` selects a separately running production server. Tests use synthetic names and phone numbers and never send external email when using `.env.example`.

`npm run build` creates the standalone server, copies its public/static assets, and bundles database operations scripts. `npm start` reads `.env.local` when present; production supervisors should inject their own environment values, which take precedence. The standalone artifact is `.next/standalone`.

For a separate production smoke test in PowerShell:

```powershell
$env:PORT='3001'
$env:HOSTNAME='127.0.0.1'
$env:SITE_URL='http://localhost:3001'
$env:LOCAL_DATABASE_PATH='.data/production-smoke'
npm start
```

Use a different PGlite directory from any running development process. Real production must use PostgreSQL with `LOCAL_DEVELOPMENT=0`.

## Production configuration

Create a private `.env.production` using `.env.example` as a reference, or inject equivalent secrets from your hosting provider. Do not commit it.

Required:

- `SITE_URL=https://aquacircle.in` at **build and runtime** for metadata and request-origin checking.
- `DATABASE_URL` for a backed-up PostgreSQL instance. Use a restricted database role and TLS on external connections.
- `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `BUSINESS_NOTIFICATION_EMAIL`. Configure sender authentication with the chosen provider. STARTTLS is required outside local mode unless implicit TLS is enabled.
- `RATE_LIMIT_SECRET`: a long random private value, for example `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `LOCAL_DEVELOPMENT=0`.

Only enable `TRUST_PROXY=true` when a controlled reverse proxy **replaces**, rather than forwards arbitrary, `x-forwarded-for`. Otherwise a shared global submission limit and per-mobile limit apply. Put the app behind HTTPS. Public contact variables are consumed at build time, so rebuild after changing them.

`src/config/business.ts` contains the single approved-coverage and business configuration. Unknown phone, WhatsApp, address, hours and social links are omitted. Its `areas` list is deliberately empty until coverage is approved. A valid PIN never automatically means confirmed coverage.

The privacy/service/terms pages describe the implemented flow without inventing prices, cancellation fees, warranty periods or annual-plan terms. Before public launch, supply the business identity/contact information, confirm the actual operating procedures, approve coverage and ensure the policies match those procedures.

## Delivery operations

`POST /api/enquiries` validates and limits the request, saves it durably, then returns HTTP 202 with a real reference. The response confirms receipt only. SMTP is attempted after the response. Failures remain `EMAIL_FAILED`, with exponential backoff and a recoverable delivery lease. The production worker retries every 30 seconds, up to ten attempts; exhausted records remain available for operational review. Stable SMTP Message-IDs and enquiry idempotency keys limit duplicates, but SMTP delivery is at least once: a process failure after provider acceptance can cause a duplicate notification.

For Node.js/Docker hosting, run the worker alongside the web server. Netlify uses the scheduled functions above instead:

```powershell
node --env-file=.env.production dist/operations/migrate.mjs
node --env-file=.env.production dist/operations/worker.mjs
```

Review pending/failed notifications regularly; the command prints references and status, not customer details:

```powershell
node --env-file=.env.production dist/operations/operations.mjs
node --env-file=.env.production dist/operations/operations.mjs AC-2026-EXACTREFERENCE
```

The second command requires a real reference matching `AC-YYYY-` plus 12 hexadecimal characters and resets a failed notification for retry after the SMTP issue is corrected. No public administration endpoint exposes customer records.

The worker runs retention daily: handled records older than `ENQUIRY_RETENTION_DAYS` (default 180) are deleted; unresolved notifications remain for recovery. Configure backups and their retention separately. You can also run:

```powershell
node --env-file=.env.production dist/operations/retention.mjs
```

`SEND_CUSTOMER_ACKNOWLEDGEMENT=true` enables an optional acknowledgement for supplied email addresses. It is best effort and independent of the durable business-notification retry status. `/api/health` checks database access and required mail/rate-limit configuration; it does not prove remote SMTP delivery.

## Docker

Build and run only the web container against externally configured PostgreSQL and SMTP:

```powershell
docker build --target runner -t aquacircle:local .
docker run --rm --name aquacircle --env-file .env.production -p 127.0.0.1:3000:3000 aquacircle:local
docker build --target worker -t aquacircle-worker:local .
docker run --rm --name aquacircle-worker --env-file .env.production aquacircle-worker:local
```

Or run the complete database/web/worker stack:

```powershell
docker compose --env-file .env.production up --build -d
```

For Compose, also set `POSTGRES_PASSWORD` in `.env.production` using a strong URL-safe value. The database is internal; the web port binds only to loopback. Put your chosen HTTPS reverse proxy in front before authorised publication. No production DNS is configured by this project.

## Routes and assets

The 15 content routes are `/`, `/services`, six service detail pages, `/service-areas`, `/about`, `/contact`, `/faq`, `/privacy-policy`, `/terms`, and `/service-policy`. Every detail page has a scoped description, included work, possible extras, a question, related links and a preselected booking button. See `src/content/services.ts` for the canonical service IDs/slugs.

Additional endpoints: `/api/enquiries`, `/api/coverage`, `/api/health`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image` and `/icon.svg`. Missing pages show a branded 404.

- `docs/asset-mapping.md`: full inventory, source mapping, crops and image-generation prompts.
- `assets/originals`: local-only untouched reference artwork, ignored by Git and excluded from public assets and Docker.
- `assets/generated`: local-only illustrative service photographs, not claims about actual staff; ignored by Git.
- `public/images`: optimized WebP files. Rebuild with `node scripts/prepare-assets.mjs`.
- `src/app/fonts`: locally bundled Manrope Latin variable font and SIL Open Font License, loaded using `next/font/local`.
- `artifacts/screenshots`: local-only desktop/mobile, five slides, services, booking modal, navigation and footer captures; ignored by Git.

Capture screenshots with `node scripts/screenshots.mjs`. The current preview URL is selected by `PLAYWRIGHT_BASE_URL`. Performance measurements are saved in `artifacts/performance`; they are local lab results, not field Core Web Vitals.

Implementation references: [Next.js standalone hosting](https://nextjs.org/docs/app/guides/self-hosting), [Next.js fonts](https://nextjs.org/docs/app/getting-started/fonts), [GSAP React cleanup](https://gsap.com/resources/React/).
