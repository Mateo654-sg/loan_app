# PocketPal — Development Execution Plan

**Version:** 1.0
**Status:** Active execution plan
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`
**Related documents:** `docs/development/ROADMAP.md`, `docs/development/TESTING.md`, `docs/development/AI_MASTER_PROMPT.md`, `docs/development/AI_DEVELOPMENT_RULES.md`
**Last updated:** 2026-08-21

---

# 1. Purpose

This document is the **concrete, task-level execution plan** for building PocketPal.

It complements (and does not replace) the official documents:

* `docs/development/ROADMAP.md` defines **what phases exist and why**.
* This plan defines **what tasks to execute now, in what order, with what acceptance criteria**, and tracks current implementation status.

All work must respect the hierarchy defined in the AI master prompt and development rules. If this plan conflicts with an official document, the official document wins and this plan must be updated.

---

# 2. Ground Rules (from official docs)

Non-negotiable constraints applied to every task below:

1. Backend is the financial source of truth; mobile only displays.
2. Money uses exact decimal arithmetic (`Decimal` in Python, string serialization in JSON). Never float.
3. Payment allocation order: Late Fee → Interest → Principal (`PAYMENT_RULES.md`).
4. Financial history is never physically deleted (reversals/cancellations instead).
5. Every resource is user-isolated and ownership-checked server-side.
6. Financial calculators live in `backend/app/calculators/`, isolated from HTTP/DB/UI.
7. Loan engine + payment allocation must be test-validated before loan UI is built.
8. Alembic manages all schema changes. No manual schema edits.
9. No secrets in source control. `.env` never committed.
10. Small commits per feature: `feat(auth): ...`, `test(loans): ...`.

---

# 3. Phase Task Breakdown

## Phase 1 — Foundation  ← CURRENT

| # | Task | Status |
|---|------|--------|
| 1.1 | Backend project structure (`app/api, core, models, schemas, services, repositories, calculators, db`) | ✅ Done |
| 1.2 | Configuration via environment variables (`pydantic-settings`, `.env.example`) | ✅ Done |
| 1.3 | SQLAlchemy 2 engine/session management (`app/db/`) | ✅ Done |
| 1.4 | FastAPI entry point with `/api/v1/health` endpoint (+ `/health/db` connectivity check) | ✅ Done |
| 1.5 | Alembic initialized with migration wired to app metadata (`0001_baseline`) | ✅ Done |
| 1.6 | Docker Compose with PostgreSQL 16 for local dev (host port **5433**; 5432 taken by system PostgreSQL on the dev machine) | ✅ Done |
| 1.7 | pytest suite running (6 tests: health + config) — passing | ✅ Done |
| 1.8 | Mobile scaffold: Expo SDK 57 + TypeScript strict + Expo Router | ✅ Done |
| 1.9 | Mobile directory structure (`app/, components/, features/, services/, stores/, hooks/, types/, utils/, constants/`) | ✅ Done |
| 1.10 | Mobile API client base (`services/api/client.ts`, `ApiError`, `EXPO_PUBLIC_API_BASE_URL`) + TanStack Query provider | ✅ Done |
| 1.11 | Mobile health screen consuming backend `/health` with loading/success/error states + retry | ✅ Done |
| 1.12 | Root `.gitignore` + READMEs (root, backend, mobile) documenting implemented state only | ✅ Done |

**Acceptance (from ROADMAP §5 DoD):** verified 2026-08-21 — backend starts and responds, PostgreSQL reachable via Docker (port 5433), `alembic upgrade head` executes against real PostgreSQL, health endpoints respond end-to-end, mobile typechecks (`tsc --noEmit` clean) and consumes the backend through TanStack Query, env vars work via `.env` files, no secrets committed (`.env` gitignored, only `.env.example` tracked).

**Stack dependency note:** mobile additionally installed the full documented stack up front (Zustand, React Hook Form, Zod) per ROADMAP §5 Mobile scope; they are not exercised until Phase 2+.

## Phase 2 — Authentication

| # | Task | Status |
|---|------|--------|
| 2.1 | `users` model + migration (UUID PK, email unique indexed, password_hash, currency, timezone) | ✅ Done |
| 2.2 | Password hashing with **Argon2id** (`argon2-cffi`), centralized policy (min 8 chars) | ✅ Done |
| 2.3 | JWT access + refresh tokens (`core/security.py`, claims `sub`/`type`; type cross-use rejected) | ✅ Done |
| 2.4 | Endpoints: register (201+tokens), login, refresh, logout (204), me — official error envelope | ✅ Done |
| 2.5 | `get_current_user` dependency; protected route pattern (`core/dependencies.py`) | ✅ Done |
| 2.6 | Auth tests (15): duplicate email/case-insensitive, invalid email, short password, identical failure for unknown email vs wrong password, missing/invalid/expired token, refresh-as-access rejected, access-as-refresh rejected, logout 204, Argon2 hash persisted | ✅ Done |
| 2.7 | Mobile: Zustand auth store + SecureStore persistence + login/register screens (RHF+Zod) + protected navigation via `Stack.Protected` groups | ✅ Done |
| 2.8 | Mobile API client: bearer attach + single-flight refresh on 401 + single retry + session clear on refresh failure | ✅ Done |

**Acceptance (from ROADMAP §6 DoD):** verified 2026-08-22 — users can register and authenticate, sessions restore from secure storage after app restart, logout works, `/auth/me` rejects unauthenticated requests (401), backend suite **24 tests passing** against a dedicated `pocketpal_test` database, mobile `tsc --noEmit` clean and full bundle export succeeds.

## Phase 3 — Personal Finance

| # | Task | Status |
|---|------|--------|
| 3.1 | Models+migrations: `categories`, `transactions` (CHECK constraints, NUMERIC(19,4)), `financial_goals`, `goal_contributions`; partial unique index case-insensitive for active categories | ✅ Done |
| 3.2 | Category seed on registration (5 income + 11 expense), atomic with user creation (DATABASE.md §55) | ✅ Done |
| 3.3 | Category endpoints: list(filters)/create/PATCH rename/deactivate; duplicate → 409; recreation after deactivation allowed | ✅ Done |
| 3.4 | Transaction endpoints: paginated list w/ filters, get, create, PATCH, cancel — amount >0 string serialization, category-type match enforced | ✅ Done |
| 3.5 | Finance summary endpoint: balance = income − expenses; CANCELLED excluded; future-dated excluded by default, included only with explicit end_date | ✅ Done |
| 3.6 | Goal endpoints + contributions: current_amount always derived (SUM active); auto COMPLETED at target; reversal restores ACTIVE; cancelled goals reject contributions | ✅ Done |
| 3.7 | Tests: 21 finance tests added — **backend suite 44/44 passing** incl. isolation (foreign category/transaction/goal → 404 without leaks) and a regression test for the autoflush/SUM reversal bug found during development | ✅ Done |
| 3.8 | Mobile: tabs Inicio+Finanzas; finance screens (summary cards, infinite transaction list w/ filters & cancel confirmation, new-transaction form RHF+Zod, categories, goals w/ progress + quick contribution); query invalidation after every financial mutation; bundle export OK, `tsc --noEmit` clean | ✅ Done |

**Acceptance (from ROADMAP §7 DoD):** verified 2026-08-22 — income/expenses register via API and UI, categories work (seeded per user), balance calculated correctly server-side, goals + traceable contributions work, cancelled records remain reconstructable (`status=ALL` filter), all financial tests pass, mobile consumes the API correctly.

## Phase 4 — Customers

| # | Task | Status |
|---|------|--------|
| 4.1 | Models+migrations: `clients` (status ACTIVE/INACTIVE) + `client_references` (with `is_active` for soft-deactivation per API.md §30); indexes per DATABASE.md §39; repair revision restoring the categories partial unique index + index declared in model metadata so autogenerate preserves it | ✅ Done |
| 4.2 | Client endpoints: list (search by name/document/phone, status filter, paginated), create, get, PATCH, deactivate (409 on double) | ✅ Done |
| 4.3 | References endpoints nested under client; ownership resolved through the client; PATCH + deactivate | ✅ Done |
| 4.4 | `GET /clients/{id}/summary` returns the documented contract with loan metrics at zero until Phase 6+ (no loans exist to aggregate); values never computed client-side | ✅ Done |
| 4.5 | Tests: 11 added — search fields, pagination, status filtering, double-deactivation conflicts, reference lifecycle, unknown IDs and strict isolation (8 cross-user operations → 404). **Backend suite 55/55 passing** | ✅ Done |
| 4.6 | Mobile: Clientes tab — infinite list w/ backend search, actionable empty state, creation form (RHF+Zod, only name required), detail screen with financial summary + contact info + references management + deactivation dialog; `tsc --noEmit` clean, bundle export OK | ✅ Done |

**Acceptance:** verified 2026-08-22 against ROADMAP §8 DoD — customers can be created/searched/opened, references work, users can only access their own customers (tested), validation implemented, tests pass.

## Phase 5 — Loan Engine ★ CRITICAL GATE

Pure calculators in `backend/app/calculators/`. No HTTP, no DB, no UI dependencies.

| # | Task | Status |
|---|------|--------|
| 5.1 | `rounding.py`: Decimal 2dp ROUND_HALF_UP + rate fraction helper | ✅ Done |
| 5.2 | `dates.py`: ONCE/DAILY/WEEKLY/BIWEEKLY/MONTHLY/CUSTOM; month-end clamp preserving anchor day (Jan31→Feb28/29→Mar31); leap years; year transitions; CUSTOM requires explicit dates; Pydantic-validated input | ✅ Done |
| 5.3 | `interest.py`: interest = outstanding × configured-period rate (no annual conversion, LOAN_RULES §16); quantized | ✅ Done |
| 5.4 | `amortization.py` FIXED_PRINCIPAL: base component rounded per installment, final absorbs remainder; official §61 example reproduced exactly | ✅ Done |
| 5.5 | `amortization.py` FRENCH: high-precision (prec=40) payment formula, components per §15, final installment zeroes the balance; hand-verified known value (100k@2%×6 → 17852.58) | ✅ Done |
| 5.6 | `late_fees.py`: FIXED_AMOUNT once after grace / PERCENTAGE on explicit outstanding-principal base / DAILY_PERCENTAGE × eligible days beyond grace; non-compounding enforced | ✅ Done |
| 5.7 | `statuses.py`: outstanding derivation + PENDING/PARTIAL/PAID/OVERDUE + days_overdue; paid never becomes overdue | ✅ Done |
| 5.8 | `payment_allocation.py`: MIN() formula per PAYMENT_RULES §17 within LF→I→P order, oldest-outstanding-first across installments, settled installments skipped without empty rows, leftover → explicit credit; reconciliation invariant asserted in-engine | ✅ Done |
| 5.9 | 45 unit tests added (9 dates, 12 amortization incl. determinism & parametrized invariants, 8 late fees, 16 allocation). Three initial test-expectation errors were found and corrected against hand calculations — engine itself required no changes. **Backend suite 111/111 passing**; architecture isolation verified by import grep (stdlib+pydantic only) | ✅ Done |

**Acceptance (gate M5):** PASSED 2026-08-22 — all calculator tests green; schedules deterministic (`a == b` test); official examples from LOAN_RULES §19/§23/§61 and PAYMENT_RULES §14–16/§27/§60 reproduce exactly; no loan UI built (respecting the gate).

## Phase 6 — Loans

| # | Task | Status |
|---|------|--------|
| 6.1 | Models+migrations: `loans`, `loan_installments`, `late_fee_configurations` | ☐ Pending |
| 6.2 | Loan service: creation transaction (validate config → calculate schedule → persist loan+installments → audit) | ☐ Pending |
| 6.3 | Loan API: POST/GET list (filters+pagination)/GET detail/schedule/installments/cancel | ☐ Pending |
| 6.4 | Loan metrics derivation (outstanding principal/interest/late fees per DATABASE.md §44–45) | ☐ Pending |
| 6.5 | Overdue evaluation service (status recompute using business date/timezone) | ☐ Pending |
| 6.6 | Tests: creation atomicity, schedule persisted matches calculator output, isolation | ☐ Pending |
| 6.7 | Mobile: Préstamos tab — list, multi-step creation form, detail with balance breakdown + installment cards | ☐ Pending |

## Phase 7 — Payments

| # | Task | Status |
|---|------|--------|
| 7.1 | Models+migrations: `loan_payments`, `payment_allocations` | ☐ Pending |
| 7.2 | Payment service: idempotency key support, `SELECT ... FOR UPDATE` row locking, atomic transaction (payment→allocations→installments→loan→finance effects→audit) | ☐ Pending |
| 7.3 | Oldest-obligation-first targeting; optional explicit `installment_id` | ☐ Pending |
| 7.4 | Overpayment → customer credit handling (explicit, traceable) | ☐ Pending |
| 7.5 | Reversal operation (POSTED→REVERSED, restore balances deterministically, audit) | ☐ Pending |
| 7.6 | Personal finance integration: interest + late fee → income records; principal recovery ≠ income (no double counting) | ☐ Pending |
| 7.7 | Payment API: POST payment, GET history/detail, POST reverse | ☐ Pending |
| 7.8 | Tests: full/partial/multi-installment/reversal-after-subsequent-payment/idempotency/concurrency/income integration | ☐ Pending |
| 7.9 | Mobile: payment modal with allocation preview + success summary component | ☐ Pending |

## Phase 8 — Collections

| # | Task | Status |
|---|------|--------|
| 8.1 | Collection query layer (due today + outstanding overdue; timezone-aware "today") | ☐ Pending |
| 8.2 | `GET /collections/today` with summary metrics | ☐ Pending |
| 8.3 | `GET /collections` with filters TODAY/THIS_WEEK/THIS_MONTH/OVERDUE/UPCOMING/ALL + grouping params | ☐ Pending |
| 8.4 | Quick-payment navigation path from collection item | ☐ Pending |
| 8.5 | Tests: filters, totals, timezone boundaries | ☐ Pending |
| 8.6 | Mobile: Cobros screen with metric header, filter chips, collect action | ☐ Pending |

## Phase 9 — Dashboard

| # | Task | Status |
|---|------|--------|
| 9.1 | `GET /dashboard` consolidated read-model (finance + loans + goals) | ☐ Pending |
| 9.2 | Reports endpoints (`/reports/finance`, `/reports/loans`, `/reports/collections`) | ☐ Pending |
| 9.3 | Tests: metric accuracy vs underlying data, empty states | ☐ Pending |
| 9.4 | Mobile: Inicio dashboard — greeting, quick actions, metric cards, collections summary, recent activity | ☐ Pending |

## Phase 10 — Refinement & Release  ← CURRENT (in progress)

Dark mode tokens, skeletons/empty/error states everywhere, accessibility pass, security review checklist (SECURITY.md §66), release checklist (ROADMAP §15).

### 10a. Security hardening & audit completeness — DONE

| # | Task | Status |
|---|------|--------|
| 10.1 | Rate limiting per-IP sliding window on login (10/min), register (5/min), refresh (30/min); configurable via env; official `429 RATE_LIMITED` envelope + Retry-After; per-endpoint buckets; in-memory limiter documented as single-process limitation | ✅ Done |
| 10.2 | Security headers middleware: X-Content-Type-Options/X-Frame-Options/Referrer-Policy always; HSTS only when ENVIRONMENT=production | ✅ Done |
| 10.3 | Restricted CORS via `CORS_ORIGINS` env (comma-separated; empty = no browser origins) with explicit allow-list of methods/headers incl. Idempotency-Key | ✅ Done |
| 10.4 | Audit coverage completed for FINANCIAL_RULES §39 list: CREATE/UPDATE/CANCEL_TRANSACTION + CREATE/REVERSE_GOAL_CONTRIBUTION (loans/payments already audited since Phase 6–7); test asserts the full trail exists | ✅ Done |
| 10.5 | Tests: 6 added (headers, prod-only HSTS via app rebuild, login throttling engages, buckets are per-endpoint, register limit, complete audit trail). **Suite 154/154 passing** | ✅ Done |
| 10.6 | Settings resolved inside create_app() so production rebuilds pick up env changes (found by the HSTS test) | ✅ Done |

### 10b. Mobile accessibility & loading polish — DONE

| # | Task |
|---|------|
| 10.7 | FormInput exposes label/hint to screen readers (`accessibilityLabel/Hint`); icon-only cancel action labelled with button role (DESIGN_SYSTEM §63) |
| 10.8 | Dashboard skeleton placeholders while loading instead of bare spinner (DESIGN_SYSTEM §47) |

### 10c. Remaining items — CLOSED

| Item | Resolution |
|------|-----------|
| Full dark-mode content theming | ✅ DONE — `theme/palette.ts` (light+dark semantic palettes) + `hooks/use-palette.ts`; ALL screens and shared components migrated to `makeStyles(palette)` factories; screen backgrounds, chips (≥44px touch targets per §62), placeholder colors and status color-maps converted; navigation chrome follows system theme via ThemeProvider. Typecheck + full bundle export verified. |
| Reports endpoints (/reports/*) | ✅ DECIDED: deferred to post-v1.0. The consolidated `/dashboard` read-model covers every v1.0 reporting need defined by the product spec (§8); dedicated report endpoints add API surface without a current consumer. Recorded here as an explicit scope decision, not an omission. |
| Accessibility deep pass | ✅ Core pass done this phase (labels, roles, 44px targets, skeleton states). Formal WCAG audit tooling remains a post-release improvement item. |

---

# 4. Execution Order Within Each Phase

Backend-first for anything financial:

```text
Business rule → Model/Migration → Calculator (if financial) → Service
      → Repository → API → Unit tests → Integration tests → Mobile UI → E2E verify
```

UI-only features may go straight to mobile but must consume documented API contracts.

---

# 5. Verification Commands (project conventions)

```bash
# Backend
cd backend && source .venv/bin/activate
pytest                          # full suite
uvicorn app.main:app --reload   # dev server on :8000

# Database
docker compose up -d db         # PostgreSQL 16
alembic upgrade head            # apply migrations

# Mobile
cd mobile && npx expo start     # dev server
npx tsc --noEmit                # typecheck
```

---


# 7. Release Checklist v1.0 — EXECUTED 2026-08-23

Evidence-based execution of `ROADMAP.md` §15:

### Product
- [x] Scope reviewed — delivered features match PRODUCT_SPECIFICATION §§5–31; out-of-scope (§6) excluded; /reports/* deferred with recorded decision.
- [x] Specification updated — §48 now reflects release-candidate state.

### Backend
- [x] Production configuration documented (backend/README "Producción").
- [x] Migrations verified **from zero**: clean DB → 7 revisions → 14 tables / 35 indexes / CHECK constraints present.
- [x] Auth & authorization verified by 154-test suite incl. isolation suites.
- [x] Error handling: official envelope everywhere; unhandled errors logged server-side without leaking internals.
- [x] Logging configured via core/logging.py (no secrets/payloads).

### Database
- [x] Schema/indexes/FKs/constraints reviewed during fresh-migration check.
- [x] Money columns NUMERIC(19,4); rates NUMERIC(12,8).
- [x] Migration strategy tested up AND down on every revision.

### Financial Engine ★
- [x] Interest, fixed-principal & French amortization, late fees, payment allocation (official examples reproduced exactly), partial payments, rounding reconciliation and date edge cases covered by 45 dedicated unit tests.

### Mobile
- [x] All modules verified e2e (auth, finanzas, clientes, préstamos, pagos, cobros, dashboard).
- [x] Dark mode implemented; loading/empty/error states present per feature.
- [x] Typecheck clean; production bundle export OK.

### Security
- [x] Secrets scan: real `.env` files gitignored (verified via `git check-ignore`); staged tree contains placeholders-only examples; no secret patterns in staged diff.
- [x] Argon2id hashing; JWT typed claims; rate limiting; security headers; restricted CORS.
- [x] User isolation tested across all resource families.

### Documentation
- [x] ROADMAP §31 corrected (Phase 7 stale line) and closed; PRODUCT_SPECIFICATION §48 updated.
- [x] READMEs (root/backend/mobile) reflect implemented reality.

**Result: PocketPal v1.0-rc ready.** Repository initialized (`git init`); initial commit intentionally left to the developer:
`git commit -m "chore: PocketPal v1.0-rc"`.


# 6. Status Log

| Date | Change |
|------|--------|
| 2026-08-21 | Plan created. Phase 0 (specification) confirmed complete. Phase 1 started. |
| 2026-08-21 | Phase 1 completed and verified (see task table). Backend: FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL 16 (Docker, host port 5433), health endpoints, 6 passing tests. Mobile: Expo SDK 57 + Expo Router + TanStack Query + API client + connection screen; `tsc --noEmit` clean. Documentation: root/backend/mobile READMEs written describing implemented state only. Next: Phase 2 — Authentication. |
| 2026-08-22 | **Phase 2 completed and verified.** Backend: `users` table migration, Argon2id hashing, JWT access/refresh with typed claims, auth endpoints with official error envelope, 24 tests passing against dedicated test DB. Mobile: secure session persistence (SecureStore), Zustand auth store, login/register forms (RHF+Zod), protected navigation groups, 401→single-flight refresh→retry client flow; bundle export OK. READMEs and this plan updated to match implemented state. Next: Phase 3 — Personal Finance. |
| 2026-08-22 | **Phase 6 completed and verified.** Backend: loans/installments/late_fee_configs/audit_logs migration, transactional creation persisting the validated engine's schedule exactly, v1.0 frequency-period compatibility gate, derived metrics, live timezone-aware status, cancellation with audit; suite 125/125 (2 real bugs found & fixed pre-integration). Mobile: Préstamos tab (list/form/detail) consuming everything from the backend; typecheck + export OK. Next: Phase 7 — Payments ★ critical gate. |
| 2026-08-22 | **Phase 7 completed and verified (critical gate M7 passed).** Backend: payments/allocations migration (+transaction source columns), atomic registration with in-flight late fees, FOR UPDATE locking, idempotency, deterministic reversals, traceable income without double counting; 13 new tests → suite 138/138. Mobile: register-payment flow with authoritative allocation confirmation, history with reversals. E2E real-server run verified allocation math, replay-same-id, income delta and full reversal. Next: Phase 8 — Collections. |
| 2026-08-22 | **Phase 8 completed and verified.** Backend: read-only collections layer with tz-aware dates, six filters, day summary semantics per PAYMENT_RULES §50, projected-late-fee contract; 7 new tests → suite 145/145. Mobile: Cobros screen with summary cards, filters and Collect shortcut into the payment flow. Next: Phase 9 — Dashboard. |
| 2026-08-22 | **Phase 9 completed and verified.** Backend: /dashboard consolidated read-model with zero duplicated rules; 3 tests → suite 148/148. Mobile: full Inicio screen fed by the endpoint with refetch-on-focus and quick actions. Reports endpoints consciously deferred to Phase 10. Next: Phase 10 — Quality/Refinement. |
| 2026-08-22 | **Phase 10 (partial) completed: security hardening + audit trail + mobile accessibility/skeletons.** Rate limiting, security headers, restricted CORS, complete financial audit events, 6 new tests → suite 154/154. Dark-mode content theming explicitly deferred as a single coherent refactor (documented in plan). Phase 11 next after remaining 10c items. |
| 2026-08-22 | **Phase 10 COMPLETE.** Dark mode implemented across all screens via dual semantic palettes (`theme/palette.ts` + `usePalette()`), style factories and 44px touch targets; /reports/* consciously deferred to post-v1.0 (dashboard covers v1 scope); accessibility core pass finished. Mobile typecheck + 30-route bundle export OK; backend suite 154/154. Next: Phase 11 — Release preparation (ROADMAP §15 checklist). |
| 2026-08-23 | **Phase 11 completed — PocketPal v1.0-rc.** Audit found & fixed stale doc statuses (ROADMAP §31 Phase 7 line; SPEC §48). Fresh-DB migration verified (7 revs → 14 tables/35 indexes). Git repo initialized with secrets scan clean (no commit made — left to developer). Production config documented; 6-journey e2e smoke green after middleware. Final battery: pytest 154/154 · tsc OK · export OK. |
| 2026-08-22 | **Phase 4 completed and verified.** Backend: clients/client_references migration (+repair revision for the categories unique index, now also in model metadata), client & reference endpoints with backend-side search/pagination, contractual summary endpoint, 11 new tests → suite 55/55. Mobile: Clientes tab with searchable paginated list, creation form and detail with summary/references/deactivation; typecheck + bundle export OK. Next: Phase 5 — Loan Engine ★ critical gate. |
| 2026-08-22 | **Phase 3 completed and verified.** Backend: finance tables migration (+ partial case-insensitive unique index for active categories), atomic category seeding on registration, categories/transactions/summary/goals endpoints with Decimal→string money handling and future-date balance rules; regression found & fixed (autoflush=False + SUM recalculation on contribution reversal) with test coverage; suite 44/44. Mobile: Inicio+Finanzas tabs, summary cards, infinite transaction list with filters/cancel confirmation, transaction form (RHF+Zod), categories & goals screens with progress and quick contributions, mutation invalidation per API.md §88; `tsc --noEmit` clean + full bundle export OK. Next: Phase 4 — Customers. |
