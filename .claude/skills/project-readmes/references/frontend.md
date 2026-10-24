# frontend/README.md

Title: `# frontend — the client applications`. Opening: Astro + Tailwind, and the three differentiated
interfaces the statement asks for: **end users**, **maintenance and operations**, **operational dashboard**.
Say how they are separated (different apps, or different routes and roles) and why.

Sections:

1. **Run**: install, `dev`, `build`, `preview`, type check. Real commands from `package.json`.
   What happens without a backend (mock) and with it (environment variable).
2. **How it is built**: tree of `src/` with one sentence per folder and the rules (what is presentation, what
   is data access).
3. **The boundary with the backend**: the API client interface and its implementations (mock and HTTP).
   Table `Variable | Implementation | What for`. The decisions not to undo (the client computes no business
   logic; the token travels in `Authorization`).
4. **Endpoints used by each app**: table `App | Method | Route | What for`. It is derived from the HTTP routes
   of `backend/functions.json`, filtering by `auth` (`user` -> users app; `maintenance`/`admin` -> maintenance
   and dashboard). If routes change, this table changes.
5. **Mobile performance**: JavaScript budget, island hydration (`client:visible`/`idle`), optimized images,
   fonts. What is measured (mobile Lighthouse) and the latest figure.
6. **Deploy**: what is published (static files on S3 + CloudFront) and the link to `infrastructure/README.md`.
   Include the hosting rewrite rule if there are dynamic routes.
7. **Pending**.

Source: `package.json`, `astro.config.*`, `src/`, routes of `backend/functions.json`.
