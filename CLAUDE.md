# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

VSA Website is a full-stack app for the Vietnamese Student Association at Green River College: event management, a product catalog, user auth, an officer-recruitment/application builder, and email notifications. It's a two-service repo (`backend/` Spring Boot, `frontend/` React) deployed together via Docker Compose.

## Commands

### Backend (`backend/`)

```bash
./mvnw clean install -DskipTests   # build without tests
./mvnw test                        # run all tests
./mvnw test -Dtest=EventServiceTest              # run a single test class
./mvnw test -Dtest=EventServiceTest#methodName   # run a single test method
./mvnw spotless:check               # verify formatting (Google Java Format)
./mvnw spotless:apply               # auto-format
./mvnw spring-boot:run              # run the API locally (port 8080)
```

### Frontend (`frontend/`)

```bash
npm install
npm run dev       # Vite dev server
npm run build     # production build
npm run lint      # ESLint
npm test          # vitest (add `-- path/to/file.test.jsx` for a single file, or `npx vitest run -t "name"`)
```

### Docker Compose (both services + reverse proxy)

```bash
docker-compose up --build
```
+Frontend on `http://localhost:8081` (nginx, proxies to the backend).
+The backend is reachable directly only inside the Compose network unless a host port mapping is added.

## Environment configuration

Backend config lives in `backend/src/main/resources/application.yaml` and is driven entirely by env vars (see `.env` at repo root, not committed): `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` (Postgres), `JWT_SECRET`, `MAIL_USERNAME`/`MAIL_PASSWORD` (Gmail SMTP), `AWS_REGION`/`S3_BUCKET_NAME`/`CLOUDFRONT_DOMAIN` (S3-backed file storage), `FRONTEND_URL` (used for both CORS and email links). Tests use `backend/src/test/resources/application-test.yaml` with an H2/test profile; CI (`.github/workflows/ci.yml`) spins up a real Postgres service container instead of using H2 for the `test` profile.

Frontend reads `VITE_API_BASE_URL` (see `frontend/src/api/config.js`); it defaults to `""`, meaning same-origin requests through nginx in production.

## Architecture

### Backend — layered Spring Boot, package-by-layer

`controller/` → `service/` → `repository/` (Spring Data JPA) → `model/` (JPA entities). Controllers are thin; business logic and validation live in services. `GlobalExceptionHandler` (`exception/`) centralizes error responses: `IllegalArgumentException` → 400, `ResourceNotFoundException` → 404, everything else → 500, all as a consistent JSON shape (`timestamp`, `status`, `error`, `message`).

**Auth.** Stateless JWT auth. `security/JwtUtil` issues/validates tokens embedding the user's email (subject) and `role` claim. `security/JwtFilter` runs once per request, reads `Authorization: Bearer <token>`, and — if valid — populates `SecurityContextHolder` with a `UsernamePasswordAuthenticationToken` carrying the role as a `GrantedAuthority`. There are three roles: `student` (default), `officer`, `president`. `config/SecurityConfig` defines the authorization matrix per path/method — check it first when adding a new endpoint, since access rules are centralized there rather than via `@PreAuthorize` annotations. Passwords are BCrypt-hashed.

**Officer application/recruitment domain** (`ApplicationRole`, `ApplicationSection`, `ApplicationQuestion`, `Applicant`, `ApplicationAnswer`) is the most involved subsystem — read `ApplicationService` before changing it:
- An `ApplicationRole` is a recruiting position with ordered `ApplicationSection`s, each with ordered `ApplicationQuestion`s. Sections/questions are auto-numbered sequentially, and deleting one renumbers the rest.
- A role starts `UNFINISHED`; any add/update/delete of its sections or questions resets it to `UNFINISHED`. `POST /api/application-roles/publish` validates every recruiting role has at least one section/question and flips valid ones to `FINISHED` — only `FINISHED` recruiting roles are exposed as "open" (`GET /api/application-roles/open`, the one public endpoint in this controller).
- `Applicant` is a student's submission against a role (unique per user+role), holding `ApplicationAnswer`s and an `ApplicantStatus`. Students manage their own submissions under `/api/applications/mine/**`; officers/presidents review everything else under `/api/applications/**` and `/api/application-roles/**` (the builder itself is officer/president-only, not student-facing).
- `ApplicationDtos` holds all request/response DTOs for this feature as nested records in one file rather than one class per file — follow that convention when extending it.

**File storage.** `FileStorageService` uploads to S3 (`S3Config` builds the `S3Client` from `aws.region`) and returns CloudFront URLs; it derives the S3 key from a CloudFront URL by parsing its path when deleting. There's a legacy local-disk path too (`WebConfig` serves `/uploads/**` from `uploads/`), but new file-handling work should go through `FileStorageService`/S3.

### Frontend — React 19 + Vite + react-router

Routes are split into two trees under `App.jsx`: `guest_pages/` under `GuestLayout` (public) and `officer_pages/` under `OfficerLayout`, gated by `ProtectedRoute` (`allowedRoles={["officer","president"]}`) which redirects to `/sign-in` if unauthenticated or `/` if the role doesn't match. There is currently no frontend UI for the officer-application/recruitment backend feature — `api/`, `officer_pages/`, and routes don't yet reference it.

**Auth.** `context/AuthContext` decodes the JWT client-side (`jwt-decode`) to get `{ email, role }` and persists the raw token in `localStorage` (noted in-code as a security follow-up — should move to cookies). `api/authHeaders.js`'s `getTokenforAuthHeader()` reads that token and builds the `Authorization` header; every authenticated API call in `api/*.js` should use it rather than reading `localStorage` directly. `context/EventsContext` wraps event data at the app root.

API modules (`api/Events.js`, `api/Products.js`, `api/auth.js`) all hit `${API_BASE_URL}/api/...` and are the pattern to follow for new endpoints — one file per resource, plain functions (no axios/fetch wrapper abstraction).

### CI/CD

`.github/workflows/ci.yml` runs backend tests against a real Postgres container and frontend tests via `vitest run` + a production build, on push to `main`/`dev` and PRs into `main`. `.github/workflows/deploy.yml` triggers on a successful CI run on `main` and SSHes into a self-hosted EC2 runner, diffing changed paths (`frontend/`, `backend/`, compose/docker files) to selectively `docker compose build`/`up` only the affected service(s), with health-check gating before marking the deploy as successful (tracked via a `.deployed-sha` file on the host).
