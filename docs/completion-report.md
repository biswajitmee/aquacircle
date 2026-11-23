# AquaCircle implementation and verification

Completed locally on 23 November 2026. The website has not been publicly deployed and production DNS was not changed.

## Implementation

The supplied homepage guided the section order, typography, warm white backgrounds, teal sections, photography, card proportions and curved hero composition. The application uses Next.js App Router, TypeScript, Tailwind CSS 3.4.19, Manrope through `next/font/local`, GSAP, React Hook Form, Zod, `next/image` and Lucide.

The five clean hero images come from the supplied artwork. Four sharp illustrative service photographs were generated to replace small reference thumbnails; they are not representations of verified staff. Original sources, crop coordinates and prompts are preserved in `asset-mapping.md` and `assets/`.

## Verified routes

| Route | Result |
| --- | --- |
| `/` | Homepage, all sections and booking flow work |
| `/services` | Six selectable services and booking flow work |
| `/services/water-purifier-installation` | Works, HTTP 200 |
| `/services/routine-servicing` | Works, HTTP 200 |
| `/services/water-purifier-repair` | Works, HTTP 200 |
| `/services/filter-replacement` | Works, HTTP 200 |
| `/services/uninstallation-reinstallation` | Works, HTTP 200; removal/refitting enquiry variants supported |
| `/services/help-choosing-a-service` | Works, HTTP 200 |
| `/service-areas` | PIN validation and availability enquiry work |
| `/about` | Works, HTTP 200 |
| `/contact` | Full enquiry form works |
| `/faq` | Accessible animated accordions work |
| `/privacy-policy` | Works, HTTP 200 |
| `/terms` | Works, HTTP 200 |
| `/service-policy` | Works, HTTP 200, including the visit-change anchor |

Unique titles, descriptions, canonical links, Open Graph image, favicon, sitemap, robots file, breadcrumbs and factual LocalBusiness/Service structured data are included. Internal footer links and image loading were checked. Missing routes display a branded 404.

## Components and motion

- Responsive sticky header; Services dropdown supports pointer, keyboard and Escape. Mobile navigation uses a modal dialog with focus containment and restoration.
- Hero: circular reveal, organic droplet reveal, five staggered vertical ribbons, diagonal wipe with aqua edge, and curved wave reveal. Manual tabs, next/previous, counter, animated underline and mobile swipe are implemented. Automatic playback is deliberately omitted.
- Entrance sequence for header, headline, copy, image and controls. ScrollTrigger reveals cover cards, steps, pricing, about, area introduction, visit details, FAQs and final CTA.
- GSAP modal entrance/exit and FAQ expansion. Animation cleanup, rapid navigation and settled clipping were tested. Reduced-motion mode remains usable.
- Six-column footer, reusable service details and one central service/business configuration.

## Booking and delivery

| Layer | Verification |
| --- | --- |
| Modal and preselection | All six service cards open the correct service |
| Browser validation | Required fields, consent, Indian mobile/PIN and inline messages checked |
| API validation | Zod, bounded JSON body, origin checks, honeypot and durable limits checked |
| Storage | PGlite locally and PostgreSQL 17 tested; real references and idempotency verified |
| SMTP integration | Actual synthetic requests reached the local SMTP capture inbox |
| Failure recovery | Failed notification retained in PostgreSQL, reset and delivered by the retry worker |
| Concurrency | Concurrent delivery claims do not send the same row twice |
| Persistence | PostgreSQL enquiry count remained unchanged across a container restart |
| Retention | Expired handled records removed; unresolved failures retained |
| Production email | Integration complete; real provider delivery remains unverified without credentials |

Receipt means the enquiry has been stored, not that an appointment is confirmed. A cold local PGlite start initially exceeded the form timeout; the form preserved the data and offered a duplicate-safe retry. Browser tests now wait for `/api/health` before starting, as a production deployment should. PostgreSQL is the production database. SMTP is at-least-once delivery; a crash after provider acceptance can produce a duplicate notification despite stable Message-IDs.

## Final checks

- Vitest: **28 tests passed**, with the database suite exercised against both PGlite and PostgreSQL.
- Playwright Chromium: **23 tests passed** against the built production server; **0 failures in the final run**.
- Responsive widths: **360, 390, 430, 768, 1024, 1440 and 1920 pixels**, with no horizontal overflow.
- Automated accessibility scan: no WCAG 2 A/AA or 2.1 AA violations on the homepage and open booking dialog.
- Lint and TypeScript checks passed without lint warnings.
- Next.js production build and standalone runtime passed.
- Docker web image built, served HTTP 200 and passed the database/configuration readiness check.
- Docker worker image built and successfully delivered a stored synthetic notification through the local SMTP capture service.
- Dependency audit: **0 known vulnerabilities** in the final installed application/development dependencies. Lighthouse was used as a temporary audit tool and removed afterward.

## Measured performance

Local Lighthouse 12.6.1 measurements of the production build, with standard desktop and simulated mobile configurations:

| Measurement | Desktop | Simulated mobile |
| --- | ---: | ---: |
| Performance | 95 | 75 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| Largest contentful paint | 1.0 s | 3.2 s |
| Total blocking time | 160 ms | 740 ms |
| Cumulative layout shift | 0 | 0 |

WebP delivery removed the expensive first-request AVIF conversion. The mobile performance goal of 90 and mobile LCP target of 2.5 seconds were **not met** in this lab run. These are local results, not field Core Web Vitals; INP was not established from real-user traffic. Reports are in `artifacts/performance/desktop.html`, `mobile.html` and their JSON counterparts.

## Visual deliverables

- `artifacts/screenshots/desktop-homepage.png`
- `artifacts/screenshots/hero-1.png` through `hero-5.png`
- `artifacts/screenshots/services.png`
- `artifacts/screenshots/booking-modal.png`
- `artifacts/screenshots/mobile-homepage.png`
- `artifacts/screenshots/mobile-hero.png`
- `artifacts/screenshots/mobile-navigation.png`
- `artifacts/screenshots/footer.png`

Desktop/mobile layouts, all five settled slide images, service cards, modal and footer were visually reviewed.

## Run and deploy

Exact installation, development, test, production, Docker and worker commands are in the root `README.md`. The shortest local start is:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run mail:dev
# In another terminal:
npm run dev
```

Production preparation includes standalone output, Docker web/worker targets, Compose files, environment examples, the health endpoint, retry/recovery commands and retention handling.

Before an authorised launch, configure the real PostgreSQL connection, SMTP sender/recipient and credentials, rate-limit secret, HTTPS hosting and domain. Supply verified contact details and approved coverage in `src/config/business.ts`/environment values, and confirm the operating and policy content matches the business. Unknown phone numbers, social accounts, localities, prices, annual-plan inclusions and warranty periods have not been invented.
