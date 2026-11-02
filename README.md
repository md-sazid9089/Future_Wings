# FutureWings

![Continuous Integration](https://github.com/Abrer19/Future_Wings/actions/workflows/ci.yml/badge.svg)
![.NET 8](https://img.shields.io/badge/.NET-8.0-purple.svg)
![React 19](https://img.shields.io/badge/React-19-blue.svg)
![Tests](https://img.shields.io/badge/Tests-228%20Passed-success.svg)

A modern, full-stack study-abroad planning and application tracking platform. Students discover university programs worldwide, shortlist and compare degrees, manage application lifecycles and deadlines, store essential visa and admission documents, and receive personalized AI-driven program recommendations. Administrators have an operations console for managing users and monitoring platform activity.

**Stack** — .NET 8 Web API with Entity Framework Core on SQL Server, paired with a modern React 19 + Vite + Tailwind CSS single-page application in `ClientApp/`.

---

## 📚 Documentation

| Document | Description |
| --- | --- |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Azure production cloud architecture, resource provisioning, Vercel frontend, and operations |
| [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Clean architecture rules, request flows, authentication, DI, and end-to-end feature guides |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema design, migrations history, reference seeders, and EF Core commands |
| [ClientApp/README.md](ClientApp/README.md) | React 19 frontend setup, design tokens, and state management |
| [SECURITY.md](SECURITY.md) | Vulnerability disclosure policy and security architecture guarantees |

---

## ⚙️ Prerequisites

- **.NET SDK 8.0+**
- **SQL Server / SQL Server Express** (a local `.\SQLEXPRESS` instance connects out-of-the-box with Windows Authentication)
- **Node.js 18+** & **npm**

---

## 🚀 Quick Start

### 1. Backend Setup (.NET 8 Web API)
```powershell
# Restore dependencies
dotnet restore

# Set the JWT signing key (stored securely in user-secrets)
dotnet user-secrets set "Jwt:Secret" "$([Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 })))" --project src/FutureWings.Web

# Run the API (automatically runs migrations and seeds reference data on startup)
dotnet run --project src/FutureWings.Web
```
The API starts on `http://localhost:5002` (and `https://localhost:7189`), with interactive Swagger UI at `http://localhost:5002/swagger`.

> **Authentication Model**: All public registrations strictly create standard **Student** accounts. Privileged **Admin** accounts cannot be created via public registration. For local judging and evaluation, an explicit local bootstrap mechanism (`POST /api/auth/bootstrap-admin`) and demo mode flags are provided.

### 2. Frontend Setup (React 19 + Vite)
In a second terminal:
```powershell
cd ClientApp
npm ci
npm run dev
```
Open <http://localhost:5173>. Vite automatically proxies `/api` calls to the backend on port `5002`.

---

## 🏆 Judge Demo & Local Evaluation

FutureWings includes a hardened, gated demo mode designed specifically for evaluators to test features without financial transactions or external third-party dependencies:

### Demo Mode Configuration
To enable demo mode, run the backend in `Development` with the demo flag:
- In `appsettings.Development.json`:
  ```json
  "DemoMode": {
    "Enabled": true,
    "SeedStaffAccounts": false
  },
  "Stripe": {
    "AllowSimulatedCheckout": true,
    "SecretKey": "sk_test_demo_51FutureWingsDemoSecretKey889201",
    "PublishableKey": "pk_test_demo_51FutureWingsDemoPublishableKey889201"
  }
  ```
- Or set environment variables:
  ```powershell
  $env:ASPNETCORE_ENVIRONMENT="Development"
  $env:FUTUREWINGS_DEMO_MODE="true"
  ```
- **Production Guard**: Demo upgrades, simulated checkouts, and test keys are **strictly rejected** in `Production` environment with RFC 7807 `ProblemDetails` (HTTP 503 Service Unavailable).

### Pre-seeded Demo Accounts
- **Judge Student Account**:
  - **Email**: `demo@futurewings.io`
  - **Password**: `Password123!`
  - Pre-populated with active applications (TUM, U of T, Stanford, Oxford, ETH Zurich), verified deadlines, uploaded vault documents, and Pro subscription entitlements.
- **Staff Demo Accounts** (Admin / Agent):
  - In Development, set `FUTUREWINGS_SEED_STAFF=true` (or `DemoMode:SeedStaffAccounts=true`) to seed `admin@futurewings.io` (`Password123!`) and `agent@futurewings.io` (`Password123!`).

### Evaluator Flow: Unlocking Demo Features (Pro & Premium Without Payment)
1. Sign in or register with any Student account on the **Free** tier.
2. Navigate to **Plans & Billing** in the left sidebar or at `#/plans`.
3. Notice the demo message banner: *"Demo access is enabled. Choose a plan to unlock its features."* and card subtext *"Unlock instantly in demo mode."* (no fake credit card inputs or real payment modals).
4. **Unlock Pro**:
   - Click **Upgrade to Pro**.
   - Shows loading state and unlocks the tier immediately via `POST /api/subscription/demo-unlock` with `{ "tier": "Pro" }`.
   - Toast confirms *"Pro features unlocked in demo mode."* and the button updates to disabled *"Current plan"*.
   - **Roadmap Unlocked**: Navigate to **Roadmap** (`#/roadmap`) — the interactive study roadmap mind map is fully accessible and unlocked.
   - **AI Interview Locked**: Navigate to **AI Interview** (`#/ai-interview`) — remains locked, indicating that **AI Interview is part of Premium**.
5. **Unlock Premium**:
   - Click **Upgrade to Premium**.
   - Immediately unlocks via `POST /api/subscription/demo-unlock` with `{ "tier": "Premium" }`.
   - Toast confirms *"Premium features unlocked in demo mode."* and the button updates to disabled *"Current plan"*.
   - **Both Features Unlocked**: Both **Roadmap** (`#/roadmap`) and **AI Interview** (`#/ai-interview`) are immediately unlocked and accessible.
6. **Idempotency Guarantee**: Repeated clicks or API calls are completely idempotent; they will never duplicate payments or create conflicting entitlements.
7. **Resetting Tier**: In Demo Mode, evaluators can click **Reset to Free Tier (Demo)** or **Switch back to Free (Demo)** at any time to return to the Free tier and re-test the upgrade flow.
8. **When Demo Mode is Inactive**: In production or when demo mode is disabled without live billing, the banner displays *"Live billing is planned but not yet available. Everything on the Free plan works normally."* and upgrade buttons are disabled with *"Unavailable until payments are configured."*. Production environments strictly reject simulated unlock requests with RFC 7807 `ProblemDetails` (HTTP 503 Service Unavailable).

---

## 🎓 Student Academic Profile Completion & Onboarding

Accurate personalized features (AI program recommendations, the interactive study roadmap knowledge graph, and tailored scholarship matching) strictly require complete student academic details.

### The Four Required Academic Core Fields
A student profile is evaluated based on four core criteria:
1. **Undergraduate / High School CGPA**: Numeric and within the `0.0`–`4.0` range.
2. **Target Academic Major**: Non-empty trimmed string representing intended major.
3. **Annual Tuition & Living Budget (USD)**: Numeric funds strictly greater than zero (`> 0`).
4. **Target Degree Level**: Valid selected degree level (`Bachelor's`, `Master's`, `PhD`, `Diploma`, `Certificate`).

### Onboarding Flow & Escape Paths
- **Server-Side Truth**: `GET /api/profile` returns calculated completion properties (`isAcademicComplete`, `completedCoreFieldsCount`, `totalRequiredCoreFieldsCount`, `missingCoreFields`, `completionPercentage`), scoped strictly by the authenticated JWT.
- **Onboarding Modal**: Incomplete student accounts see the `ProfileCompletionPrompt` modal upon login explaining why profile completion is necessary and displaying a progress tracker.
- **Escape Path (Skip for Now)**: Students can temporarily dismiss the modal for the current session to explore general pages. The dismissal is saved per-session (`sessionStorage`) and displays a persistent inline warning banner (`ProfileIncompleteBanner`) with a direct button to Complete Profile.
- **Sidebar Integration**: The sidebar account area displays `Complete Your Profile (X/4)` before `Take Product Tour`. Once completed, the normal `Take Product Tour` button is shown.
- **Non-Student Exemption**: Admin and Agent users are platform overseers and are never forced through student profile onboarding.
- **Feature Gating**:
  - **Recommendations**: Displays a dedicated incomplete-profile state detailing the missing fields with an action to Complete Profile.
  - **Roadmap / Knowledge Graph**: Highlights missing core milestones with gap nodes and an alert banner.
  - **Scholarships**: Shows general funding opportunities with a notice that personalized matching requires profile completion. General search, deadlines, and tracking remain fully operational.

---

## 🧪 Automated Testing

The solution includes an extensive automated test suite covering unit, cryptographic, security, and integration tests:

### Backend Tests (.NET 8)
```powershell
dotnet test FutureWings.sln
```

### Frontend Tests (Vitest + Testing Library)
```powershell
cd ClientApp
npm test -- --run
```

### Test Coverage (165 Backend Tests + 63 Frontend Tests = 228 Total)
- **Student Profile Onboarding & Academic Readiness**: Required 4 core academic fields validation (CGPA in [0, 4.0], trimmed major, positive budget > $0, target degree level), server-side calculation and persistence in `GET /api/profile`, onboarding prompt modal with progress bar and checklist, temporary session skip dismissal, persistent inline warning banner, sidebar completion pill placed before product tour, and graceful gating on Recommendations, Roadmap, and Scholarships.
- **Authentication Security**: Privilege escalation prevention (first user cannot become Admin), BCrypt password hashing & salt verification, token claim injection, role-based authorization.
- **Stripe & Subscriptions**: Demo-mode gating, Pro-only entitlement granting, production simulation rejection, idempotent webhook and demo unlock handling, invalid return URL rejection, live key safety guards.
- **Scholarships & Application Process Tracking**: Dedicated scholarship details view with study-level and field restrictions, official links, document criteria, idempotent user interest tracking, ordered application checklist generation, step-level completion toggling, and user ownership isolation.
- **Document Security**: Binary magic byte signatures (`%PDF`, `\x89PNG`, `JPEG`, `DOC`, `DOCX`), MIME spoofing detection, 10 MB size enforcement, path traversal defense, and ownership isolation.
- **Applications & Tracking**: Multi-status workflow (`Draft`, `Submitted`, `Under Review`, `Accepted`, `Withdrawn`), user isolation, deduplication constraints, deletion.
- **Deadlines & Planner**: Task creation, category classification, completion toggles, removal.
- **Student Profile & Recommendation**: Multi-factor ranking engine (academic fit, budget match, and personalized explanations).
- **Visa Risk Assessment**: Deterministic preparation heuristic scoring, financial coverage checking, IELTS benchmarking.

---

## 🐳 Docker & Production Deployment

A complete production-ready `docker-compose.yml` is included:
```powershell
# Copy environment template
cp .env.example .env

# Start database and API
docker compose up -d
```

### Key Deployment Guarantees
- **Persistent Documents Storage**: Document files are stored on a persistent volume mount (`document-data:/app/App_Data/documents`) so uploaded files survive container restarts and can be backed up or attached to cloud storage.
- **Configurable CORS**: Configurable via `CORS_ALLOWED_ORIGINS` environment variable (comma-separated list of approved frontend origins) or `Cors:AllowedOrigins` in `appsettings.json`.
- **Reverse Proxy / HTTPS Setup**: The API container exposes HTTP on port 5002 (`ASPNETCORE_URLS=http://+:5002`). In production, place it behind a TLS-terminating reverse proxy (Nginx, Caddy, Traefik, or AWS ALB) that terminates SSL and passes `X-Forwarded-For` and `X-Forwarded-Proto` headers.

---

## 🏗️ Solution Architecture

```text
Future_Wings/
├── ClientApp/                    # React 19 Single Page Application
│   ├── src/
│   │   ├── components/           # Reusable UI widgets, modals & dashboard cards
│   │   ├── pages/                # Route-level views (Applications, Discovery, Profile, etc.)
│   │   ├── workers/              # Background inference workers (MediaPipe & Transformers)
│   │   ├── auth.js               # Token storage & 401 session interceptor
│   │   └── App.jsx               # Navigation router & app shell
│   └── vite.config.js            # Rollup chunk splitting & API proxying
│
├── src/
│   ├── FutureWings.Domain/       # Pure domain models (Application, Program, University, User, etc.)
│   ├── FutureWings.Application/  # DTOs and service interfaces (Clean Architecture contracts)
│   ├── FutureWings.Infrastructure/ # EF Core DbContext, migrations, seeders & service implementations
│   └── FutureWings.Web/          # ASP.NET Core API controllers, JWT authentication & SignalR hubs
│
└── tests/
    └── FutureWings.Tests/        # In-Memory & security unit test suites
```

Dependencies strictly adhere to Clean Architecture:
$$\text{Domain} \longleftarrow \text{Application} \longleftarrow \text{Infrastructure} \longleftarrow \text{Web}$$
