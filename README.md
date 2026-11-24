# AquaCircle

Next.js App Router, TypeScript, Tailwind **3.4**, GSAP, React Hook Form and Zod. Prepared for Netlify, conventional Node.js and Docker hosting.

## Deploy on Netlify

1. Use the **existing** Netlify project connected to GitHub repository `biswajitmee/aquacircle`, branch `main`. Pushes to this branch should trigger its configured automatic deployment; do not create a second site.
2. Keep the base directory at the repository root. `netlify.toml` supplies **build command `npm run build:netlify`**, **publish directory `.next`**, **Node.js 22**, and `NEXT_PUBLIC_ENQUIRY_PROVIDER=netlify`. Netlify installs dependencies from `package-lock.json` and automatically uses its current Next.js adapter.
3. Before deployment, review [`.env.netlify.example`](.env.netlify.example) under **Project configuration > Environment variables**. Make `SITE_URL` available to **Builds and Functions** (or all scopes). Netlify Forms does not need PostgreSQL, SMTP credentials or `RATE_LIMIT_SECRET`. Do not import the local development `.env.local` into production.
4. Set `SITE_URL` to the exact live HTTPS origin, without a trailing slash. Initially use your actual `https://YOUR-SITE.netlify.app` address; after connecting `aquacircle.in`, set `SITE_URL=https://aquacircle.in` and redeploy. It controls canonical URLs, sitemap links and accepted booking-request origins. Redirect other domains to this primary domain in Netlify.
5. Enable Forms detection and notifications using the steps below. After deployment, `/api/health` reports `status: "managed_by_netlify"`. That reports the selected provider only; it does **not** verify form detection, storage or email delivery.

### Enable service-request notifications

1. Open the existing AquaCircle project in Netlify and go to **Forms > Enable form detection** (or **Forms > Form detection > Enable form detection**).
2. Deploy the updated `main` branch. If detection was enabled after the deploy, use **Deploys > Trigger deploy > Deploy site** to process the same source again.
3. In **Forms**, confirm that **`aquacircle-service-request`** is listed. Its deploy-time definition is `public/__forms.html`; the React form submits a URL-encoded POST to `/__forms.html`, following the current Next.js adapter's supported integration.
4. Go to **Forms > Submission notifications > Add notification > Email notification**. Choose **`aquacircle-service-request`**, set the recipient to **`info.aquacircle@gmail.com`**, and save. If the UI calls the action **Add email notification**, use that action. The submitted `subject` field sets `New AquaCircle Service Request — [Customer Name] — [Service Type]`; Netlify's supported email body lists the submitted fields.
5. If the recipient shows **pending confirmation**, open the confirmation email in `info.aquacircle@gmail.com` and select **Confirm**. Some Netlify teams only allow active team-member email addresses until external-recipient confirmation is available; in that case, use this address for an active member of the existing team before adding it. Code in this repository cannot confirm ownership of the mailbox.
6. Submit **one clearly labelled test request**, check **Forms > aquacircle-service-request > Verified submissions** (and Spam if necessary), then check Gmail Inbox/Spam for the matching reference and all fields. A successful browser response is not evidence that a notification reached the inbox.

The hosted form preserves all fields and consent, includes both ISO and Kolkata submission timestamps, and stores a request ID/reference with each submission. Required-field, phone, PIN, service and date validation stays in the existing Zod/React Hook Form flow. Netlify performs its own server-side spam filtering and the `website` honeypot. The static registration page is marked `noindex` and is not in the sitemap. Repeated clicks are blocked while submitting; Netlify Forms does not guarantee deduplication after an ambiguous network failure. The retained request ID helps staff identify retries. Review retained submissions and mailbox copies in Netlify/Gmail; the database retention job does not delete Netlify Forms records.

The older `/api/enquiries` PostgreSQL/SMTP integration remains available for localhost and standalone hosting. Without its mail/rate-limit configuration it intentionally returns 503, which caused the original hosted-form error. New Netlify submissions bypass that API. Existing `retry-enquiries` and `enquiry-retention` schedules are retained for any old database records and safely skip execution when `DATABASE_URL` is absent. Do not remove existing database credentials until any pending old requests are resolved.

The existing server-rendered pages include titles/descriptions, canonical URLs, Open Graph metadata, local fonts, optimized images, `/robots.txt`, and `/sitemap.xml`. After connecting the final domain, verify that sitemap/canonical links use it and submit `/sitemap.xml` to Google Search Console. This preserves the site's SEO setup; search rankings are not guaranteed.

Official references: [Next.js Forms integration](https://opennext.js.org/netlify/forms), [Forms setup](https://docs.netlify.com/manage/forms/setup/), [notification recipients and subjects](https://docs.netlify.com/manage/forms/notifications/).

## Optional service location

The location button requests one fresh high-accuracy browser position (12-second timeout, no cached reading). It opens a Leaflet map centered on that reading. Customers move the map beneath a fixed pin, zoom to level 20 where map data supports it, optionally recenter with another explicit GPS request, edit the selected address, add flat/building/floor/landmark/entrance details, and select **Confirm Pin Location**. The displayed GPS accuracy radius is a device estimate, not a guarantee of pin precision. No continuous position watcher runs.

Only the confirmed map center becomes the navigation destination. New locations use source `map` and the notification label **GPS + Customer-Confirmed Map Pin**. Older `browser` records remain readable for pending standalone deliveries and retain their original provenance. Cancelling leaves the previously saved location unchanged. Editing the main address removes its coordinates and offers **Reconfirm pin**; dedicated access-detail fields preserve the same pin. Changing the PIN code or clearing location removes the saved location. Manual addresses and requests without location continue to work.

Reverse lookups wait for map movement to settle and are at least 1.1 seconds apart. Generation checks and abort controllers prevent stale replies from replacing newer selections or manual edits. Failed address lookup does not block a pin confirmation; a failed map does, because a customer must be able to see the destination. Closing, cancelling, confirming or submitting invalidates pending GPS/lookup callbacks. Nothing is saved in localStorage or sent to analytics.

Netlify Forms registers `serviceLocation`, `flat`, `building`, `floor`, `landmark`, `entrance`, `latitude`, `longitude`, `locationAccuracy`, `locationSource`, `googleMaps` and a readable `serviceLocationDetails` summary. Existing native email notifications to **info.aquacircle@gmail.com** are retained; the Google Maps directions URL is on its own line. Standalone SMTP text and HTML use the same fields and retain the Maps button. Links use the confirmed coordinates, while manual addresses use address search.

### Geoapify configuration

1. Keep the existing **GEOAPIFY_API_KEY** in the Netlify project's **Functions** environment. For local development, put it in ignored `.env.local`. Never use a `NEXT_PUBLIC_` prefix or commit the key. The same key supplies maps and reverse lookup; no public browser key or Google Maps API key is needed.
2. Redeploy after changing the runtime variable. The key must allow Geoapify map tiles as well as reverse geocoding. Browser-origin restrictions are unsuitable for these server-to-server requests. If using IP restrictions, account for the hosting provider's actual egress setup.
3. Review the Geoapify project dashboard, plan quota and account limits. Do not enable billing automatically. Raster tiles use the osm-bright style, zoom levels 3?20, no retina multiplier, no prefetch/offline download, and load after movement settles. Attribution to Geoapify, OpenMapTiles and OpenStreetMap stays visible below the map.
4. `GET /api/location/tiles/[z]/[x]/[y]` validates tile coordinates and rejects cross-site browser requests, proxies only fixed Geoapify PNG URLs, strips upstream headers/errors, and never returns the private key. It honors the provider's cache lifetime up to one day and never caches errors. A per-instance cap of 240 tile requests/minute limits accidental bursts; it is not a global distributed quota limiter. Provider account controls remain authoritative.
5. `POST /api/location/reverse` accepts coordinates in a bounded JSON body from the configured site origin, returns a formatted address with no-store headers, and keeps its existing one-lookup/second per-instance throttle. Neither endpoint logs bodies, provider URLs or errors. Map areas and selected coordinates are processed by Geoapify under its privacy policy.

Without the Geoapify key or when the provider is unavailable, customers can cancel the picker and enter a manual address or omit location. The picker will not confirm a blank map. Use synthetic public points for QA. Unit and browser tests mock provider responses and device positions, exercise touch/keyboard movement, and check both notification payload formats. Real provider rendering and Gmail receipt must be verified separately in production; a successful form response does not prove email delivery.

References: [Geoapify tiles and attribution](https://apidocs.geoapify.com/docs/maps/map-tiles/), [Geoapify reverse geocoding](https://apidocs.geoapify.com/docs/geocoding/reverse-geocoding/), [Geoapify terms](https://www.geoapify.com/terms-and-conditions/), [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

## What belongs in Git

| Keep in the repository | Reason |
| --- | --- |
| `src/`, including fonts and their license | Pages, styles, SEO metadata, booking APIs and application logic |
| `public/` | Optimized images and static Netlify Forms registration |
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

The default development database is durable embedded PostgreSQL (PGlite), stored in ignored `.data/aquacircle`. It is owned by one web process. Stop that process before running an operations command against the same PGlite directory. Standalone production uses real PostgreSQL through `pg`, with the same SQL schema, durable delivery status and transactional claims. Netlify production uses Netlify Forms instead.

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

To exercise the hosted Forms transport locally, use a maintained Node.js 22.13+ release and `npx netlify-cli dev --offline --no-open --functions tests/fixtures/netlify-functions`. Netlify Dev applies the `netlify.toml` provider setting. The explicitly selected local-only `submission-created` fixture captures the CLI's parsed submission event in ignored `.data/netlify-forms-qa/latest.json`; it sends no email and is outside the production functions directory. Run `npx playwright test tests/e2e/form-submission.spec.ts` with `PLAYWRIGHT_BASE_URL=http://localhost:8888`, `PLAYWRIGHT_ENQUIRY_PROVIDER=netlify`, and `PLAYWRIGHT_NETLIFY_DEV=1`. This verifies URL-encoded requests and local handling, not production form detection or Gmail delivery. Never point the full automated suite at production; it creates multiple synthetic requests. The normal `npm run dev` workflow continues to use the local API/SMTP capture.

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

## Standalone Node.js / Docker production configuration

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
