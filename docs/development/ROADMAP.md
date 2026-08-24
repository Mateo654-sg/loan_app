# PocketPal — Development Roadmap

**Version:** 1.0
**Status:** Official Development Roadmap
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`
**Primary domains:** Personal Finance & Personal Loan Management
**Last updated:** 2026-08-21

---

# 1. Purpose

This document defines the development roadmap for PocketPal.

Its purpose is to transform the product and business specifications into an implementation plan that can be executed incrementally, while preserving:

* financial integrity;
* architectural consistency;
* testability;
* security;
* traceability;
* product scope.

The roadmap defines:

* development phases;
* objectives;
* dependencies;
* expected deliverables;
* validation criteria;
* milestones;
* release strategy.

The roadmap must be interpreted together with:

```text
docs/PRODUCT_SPECIFICATION.md
docs/business/FINANCIAL_RULES.md
docs/business/LOAN_RULES.md
docs/business/PAYMENT_RULES.md
docs/technical/ARCHITECTURE.md
docs/technical/DATABASE.md
docs/technical/API.md
docs/technical/SECURITY.md
docs/design/UI_UX.md
docs/design/DESIGN_SYSTEM.md
docs/development/TESTING.md
docs/development/AI_DEVELOPMENT_RULES.md
```

---

# 2. Development Philosophy

PocketPal will be developed incrementally.

The project must not attempt to implement the entire application simultaneously.

The development order prioritizes:

```text
Foundation
    ↓
Authentication
    ↓
Personal Finance
    ↓
Customers
    ↓
Financial Engine
    ↓
Loans
    ↓
Payments
    ↓
Collections
    ↓
Dashboard
    ↓
Quality & Refinement
```

The most financially sensitive components must be validated before they become deeply integrated into the user interface.

In particular:

> The loan calculation and payment allocation engines must be tested and validated before the complete loan management UI is considered production-ready.

---

# 3. Product Development Stages

The project is divided into the following stages:

| Stage | Phase            | Main Objective                                |
| ----- | ---------------- | --------------------------------------------- |
| 0     | Specification    | Define product and business rules             |
| 1     | Foundation       | Establish project infrastructure              |
| 2     | Authentication   | Implement secure user access                  |
| 3     | Personal Finance | Implement income, expenses and balance        |
| 4     | Customers        | Implement customer management                 |
| 5     | Loan Engine      | Implement and validate financial calculations |
| 6     | Loans            | Implement loan management                     |
| 7     | Payments         | Implement payment processing                  |
| 8     | Collections      | Implement collection management               |
| 9     | Dashboard        | Integrate financial information               |
| 10    | Quality          | Stabilize and prepare the product             |
| 11    | Release          | Prepare the first production version          |

---

# 4. Phase 0 — Specification

## Objective

Establish a sufficiently complete definition of the product before implementation.

## Status

Planning and specification.

## Deliverables

The following documents must exist:

```text
docs/
│
├── PRODUCT_SPECIFICATION.md
│
├── business/
│   ├── FINANCIAL_RULES.md
│   ├── LOAN_RULES.md
│   └── PAYMENT_RULES.md
│
├── technical/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   └── SECURITY.md
│
├── design/
│   ├── UI_UX.md
│   └── DESIGN_SYSTEM.md
│
└── development/
    ├── ROADMAP.md
    ├── TESTING.md
    └── AI_DEVELOPMENT_RULES.md
```

## Validation

Phase 0 is complete when:

* the product scope is defined;
* the initial domain entities are identified;
* financial responsibilities are separated;
* loan rules are documented;
* payment rules are documented;
* technical architecture is defined;
* database structure is defined;
* API conventions are defined;
* security requirements are defined;
* UI/UX principles are documented;
* testing strategy is documented.

---

# 5. Phase 1 — Foundation

## Objective

Create the technical foundation required by the mobile application and backend.

## Backend

Implement:

* Python environment;
* FastAPI;
* SQLAlchemy 2;
* Pydantic;
* Alembic;
* PostgreSQL;
* project configuration;
* environment variables;
* application entry point;
* database connection;
* migration system;
* health endpoint.

Expected structure:

```text
backend/
└── app/
    ├── api/
    ├── core/
    ├── models/
    ├── schemas/
    ├── services/
    ├── repositories/
    ├── calculators/
    ├── db/
    └── tests/
```

## Mobile

Implement:

* React Native;
* Expo;
* TypeScript;
* Expo Router;
* base navigation;
* application configuration;
* API client;
* TanStack Query;
* Zustand;
* React Hook Form;
* Zod.

Expected structure:

```text
mobile/
├── app/
├── components/
├── features/
├── services/
├── stores/
├── hooks/
├── types/
└── utils/
```

## Infrastructure

Configure:

* Git repository;
* `.gitignore`;
* environment configuration;
* development Docker configuration where applicable;
* PostgreSQL development environment;
* backend startup;
* mobile startup;
* API communication.

## First technical milestone

The first end-to-end request should be:

```text
Mobile
   ↓
API
   ↓
FastAPI
   ↓
Database
```

The backend must expose a basic health endpoint.

Example:

```text
GET /health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Definition of Done

* backend starts successfully;
* PostgreSQL is accessible;
* migrations execute;
* mobile application starts;
* mobile can communicate with backend;
* environment variables work;
* health endpoint responds;
* no secrets are committed.

---

# 6. Phase 2 — Authentication

## Objective

Implement secure authentication and user isolation.

## Backend

Implement:

* user model;
* registration;
* password hashing;
* login;
* JWT access token;
* refresh token;
* token validation;
* protected endpoints;
* current-user endpoint.

Potential endpoints:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

## Mobile

Implement:

* login screen;
* registration screen;
* session persistence;
* authentication state;
* protected navigation;
* logout;
* authentication error handling.

## Security requirements

Passwords must never be stored in plaintext.

Every protected financial resource must be associated with the authenticated user.

## Definition of Done

* users can register;
* users can authenticate;
* sessions can be restored;
* users can log out;
* protected routes reject unauthenticated requests;
* user data isolation is enforced;
* authentication tests pass.

---

# 7. Phase 3 — Personal Finance

## Objective

Implement the first complete financial domain.

This phase introduces:

```text
Categories
Income
Expenses
Transactions
Balance
Financial Goals
Goal Contributions
```

## 7.1 Categories

Implement:

* income categories;
* expense categories;
* category creation;
* category editing;
* category deactivation;
* category listing;
* category filtering by type.

Initial categories must follow the financial rules.

## 7.2 Transactions

Implement:

* income creation;
* expense creation;
* transaction listing;
* transaction detail;
* transaction editing;
* transaction cancellation;
* filtering;
* pagination;
* date filtering.

Transaction amounts must be positive.

The transaction type determines the financial direction.

## 7.3 Balance

Implement:

```text
Balance =
Total valid income
-
Total valid expenses
```

Future-dated transactions must follow the rules defined in:

```text
docs/business/FINANCIAL_RULES.md
```

## 7.4 Financial Goals

Implement:

* goal creation;
* goal editing;
* goal completion;
* goal cancellation;
* goal listing;
* goal details;
* contribution creation;
* contribution history;
* progress calculation.

## 7.5 Mobile UI

Implement:

* Finance screen;
* Income screen;
* Expenses screen;
* Categories screen;
* Goals screen;
* Transaction history;
* Transaction forms.

## Definition of Done

* income can be registered;
* expenses can be registered;
* categories work;
* balance is calculated correctly;
* financial goals work;
* contributions are traceable;
* cancelled records remain historically reconstructable;
* financial tests pass;
* mobile UI consumes the API correctly.

---

# 8. Phase 4 — Customers

## Objective

Implement the customer domain required for lending.

## Customer

Implement:

* customer creation;
* customer editing;
* customer detail;
* customer list;
* customer search;
* customer filtering;
* customer deactivation where applicable.

Customer information:

```text
full_name
document_number
phone
alternative_phone
email
address
notes
```

## References

Implement:

* reference creation;
* reference editing;
* reference deletion/deactivation;
* reference display.

Reference information:

```text
name
phone
address
relationship
notes
```

## Customer Summary

Prepare the domain for:

```text
active loans
total capital lent
outstanding capital
total receivable
total overdue
payment history
```

Some values will remain unavailable until the loan system is implemented.

## Definition of Done

* customers can be created;
* customers can be searched;
* customer details work;
* references work;
* users can only access their own customers;
* validation is implemented;
* customer tests pass.

---

# 9. Phase 5 — Loan Engine

## Objective

Build the core financial calculation engine before completing the loan UI.

This is one of the most critical phases of the project.

## Principle

Financial calculations must be isolated from:

* HTTP;
* database persistence;
* mobile UI;
* presentation logic.

Conceptually:

```text
backend/app/calculators/
```

## 9.1 Interest Engine

Implement:

* interest rate representation;
* interest period;
* periodic interest calculation;
* outstanding principal calculation;
* deterministic rounding.

## 9.2 Fixed Principal

Implement:

```text
principal per installment
=
principal / number of installments
```

The final installment must correct rounding differences.

## 9.3 French Amortization

Implement:

* periodic payment calculation;
* interest component;
* principal component;
* remaining balance;
* rounding behavior.

Each installment must contain:

```text
total_payment
principal
interest
remaining_balance
```

## 9.4 Payment Frequencies

Implement:

```text
ONCE
DAILY
WEEKLY
BIWEEKLY
MONTHLY
CUSTOM
```

The date engine must correctly handle:

* February;
* leap years;
* month transitions;
* year transitions.

## 9.5 Late Fees

Implement:

```text
FIXED_AMOUNT
PERCENTAGE
DAILY_PERCENTAGE
```

Support:

```text
grace_period_days
```

Late fees must remain separate from ordinary interest.

## 9.6 Installment State Engine

Implement:

```text
PENDING
PARTIAL
PAID
OVERDUE
CANCELLED
```

The backend must determine installment status.

## 9.7 Required Tests

Before moving to the next phase, test:

* fixed principal;
* French amortization;
* rounding;
* interest;
* late fees;
* dates;
* overdue calculations;
* zero balances;
* final installment adjustments.

## Critical milestone

The loan calculator must produce deterministic results for known scenarios.

Example:

```text
Input
    Principal
    Rate
    Period
    Frequency
    Installments
    Start date

Output
    Schedule
    Principal
    Interest
    Payment
    Remaining balance
    Due dates
```

## Definition of Done

Phase 5 cannot be considered complete until:

* calculations are isolated;
* calculations are deterministic;
* automated tests pass;
* rounding is validated;
* date calculations are validated;
* late fees are validated;
* loan schedules are reproducible.

---

# 10. Phase 6 — Loans

## Objective

Integrate the validated financial engine with persistence and the mobile application.

## Backend

Implement:

* loan creation;
* loan retrieval;
* loan editing where permitted;
* loan cancellation;
* loan schedule generation;
* installment persistence;
* loan status;
* loan balance;
* loan history.

Potential endpoints:

```text
POST /loans
GET /loans
GET /loans/{id}
PATCH /loans/{id}
POST /loans/{id}/cancel
GET /loans/{id}/installments
```

## Loan Creation

The creation flow must collect:

```text
customer
principal
start_date
interest_rate
interest_period
amortization_type
payment_frequency
number_of_installments
first_due_date
late_fee_configuration
guarantee
notes
```

## Loan Schedule

After creation:

```text
Loan
  ↓
Financial Engine
  ↓
Installment Schedule
  ↓
Database
```

The generated schedule must be persisted according to the database design.

## Mobile

Implement:

* loan list;
* loan creation form;
* loan details;
* installment schedule;
* loan status;
* financial summary.

## Definition of Done

* loans can be created;
* schedules are generated correctly;
* installments persist correctly;
* balances are accurate;
* loan status is correct;
* loan details work;
* tests pass;
* mobile integration works.

---

# 11. Phase 7 — Payments

## Objective

Implement payment registration and deterministic allocation.

This phase is financially sensitive and must follow:

```text
docs/business/PAYMENT_RULES.md
```

## Payment Registration

Implement:

* payment creation;
* payment date;
* amount;
* payment method;
* notes;
* payment history.

Potential endpoint:

```text
POST /loans/{id}/payments
```

## Payment Allocation

The initial recommended allocation order is:

```text
1. Late fee
2. Interest
3. Principal
```

The allocation engine must determine:

```text
amount allocated to late fee
amount allocated to interest
amount allocated to principal
remaining amount
```

## Partial Payments

Support:

* partial installment payment;
* full installment payment;
* payment covering multiple installments;
* overdue payment;
* payment with late fee;
* payment with interest;
* principal recovery.

## Payment History

Payments must remain historically traceable.

Physical deletion of financial payment history is prohibited.

Corrections should use:

```text
reversal
adjustment
```

mechanisms where applicable.

## Integration With Personal Finance

A payment can produce:

```text
Principal recovered
Interest received
Late fee received
```

The system must avoid double counting.

Example:

```text
Customer payment = $120,000

Principal = $100,000
Interest  = $20,000
```

Personal financial income must not become:

```text
$120,000 + $20,000
```

Only the applicable income components should be recorded as income.

## Definition of Done

* payments can be registered;
* allocation is deterministic;
* partial payments work;
* multiple-installment payments work;
* loan balances update correctly;
* installment balances update correctly;
* personal finance integration does not double count;
* payment history is preserved;
* reversal strategy works;
* tests pass.

---

# 12. Phase 8 — Collections

## Objective

Create the operational collection system.

## Today's Collections

Implement:

```text
GET /loans/collections/today
```

Display:

* customer;
* loan;
* installment;
* due date;
* expected amount;
* paid amount;
* outstanding amount;
* days overdue;
* late fee;
* status.

## Summary

Display:

```text
Expected today
Collected today
Pending today
Overdue
```

## General Collections

Implement filters:

```text
TODAY
THIS_WEEK
THIS_MONTH
OVERDUE
UPCOMING
ALL
```

## Grouping

Support grouping by:

```text
customer
date
loan
status
```

## Quick Payment

The collection interface should allow the user to move efficiently from:

```text
Collection
   ↓
Customer
   ↓
Loan
   ↓
Installment
   ↓
Register payment
```

## Definition of Done

* today's collections work;
* overdue collections work;
* upcoming collections work;
* filters work;
* collection amounts are correct;
* payment registration is accessible;
* collection status updates after payment;
* tests pass.

---

# 13. Phase 9 — Dashboard

## Objective

Create the main financial overview of PocketPal.

The dashboard combines:

```text
Personal Finance
+
Loan Portfolio
```

without mixing financial concepts incorrectly.

## Personal Finance Metrics

Display:

* current balance;
* monthly income;
* monthly expenses;
* financial goals;
* goal progress.

## Loan Metrics

Display:

* total capital lent;
* outstanding capital;
* generated interest;
* collected interest;
* today's collections;
* total receivable;
* total overdue.

## Charts

Initial visualizations:

```text
Income vs Expenses
Expenses by Category
Balance Evolution
Capital Lent vs Outstanding
Collected vs Receivable
Generated Interest vs Collected Interest
```

## Important Principle

Dashboard values must be calculated from authoritative backend data.

The frontend must not independently reconstruct financial metrics.

## Definition of Done

* dashboard loads correctly;
* personal metrics are accurate;
* loan metrics are accurate;
* charts use correct data;
* loading states work;
* empty states work;
* errors are handled;
* mobile performance is acceptable.

---

# 14. Phase 10 — Refinement and Quality

## Objective

Stabilize the product before release.

## UI/UX

Implement:

* light mode;
* dark mode;
* design tokens;
* consistent typography;
* spacing system;
* semantic colors;
* empty states;
* loading states;
* skeleton loaders;
* validation feedback;
* confirmation dialogs;
* success feedback;
* error states.

## Accessibility

Review:

* touch targets;
* contrast;
* readable typography;
* form labels;
* error messages;
* navigation;
* screen-reader semantics where applicable.

## Performance

Review:

* API response times;
* unnecessary requests;
* mobile rendering;
* list virtualization;
* database indexes;
* pagination;
* expensive calculations.

## Security

Perform:

* authentication review;
* authorization review;
* user-isolation testing;
* secret review;
* input validation review;
* API security review.

## Data Integrity

Review:

* decimal handling;
* transaction consistency;
* payment allocation;
* concurrency;
* duplicate requests;
* auditability;
* reversal operations.

## Definition of Done

* critical bugs resolved;
* security review completed;
* financial tests pass;
* API tests pass;
* mobile tests pass;
* database migrations work;
* production configuration is documented.

---

# 15. Phase 11 — Release Preparation

## Objective

Prepare PocketPal v1.0 for its first controlled release.

## Release Checklist

### Product

* [ ] Product scope reviewed.
* [ ] All v1.0 critical features implemented.
* [ ] Out-of-scope features excluded.
* [ ] Product specification updated.

### Backend

* [ ] Production configuration defined.
* [ ] Database migrations verified.
* [ ] API documentation verified.
* [ ] Authentication verified.
* [ ] Authorization verified.
* [ ] Error handling verified.
* [ ] Logging configured.

### Database

* [ ] Schema reviewed.
* [ ] Indexes reviewed.
* [ ] Foreign keys verified.
* [ ] Constraints verified.
* [ ] Decimal fields verified.
* [ ] Migration strategy tested.

### Financial Engine

* [ ] Interest calculations verified.
* [ ] Amortization verified.
* [ ] Late fees verified.
* [ ] Payment allocation verified.
* [ ] Partial payments verified.
* [ ] Rounding verified.
* [ ] Date calculations verified.

### Mobile

* [ ] Authentication flow verified.
* [ ] Finance module verified.
* [ ] Customer module verified.
* [ ] Loan module verified.
* [ ] Payments verified.
* [ ] Collections verified.
* [ ] Dashboard verified.
* [ ] Dark mode verified.
* [ ] Error states verified.

### Security

* [ ] Secrets removed from repository.
* [ ] Production secrets configured securely.
* [ ] Password hashing verified.
* [ ] JWT configuration verified.
* [ ] User isolation tested.
* [ ] Protected endpoints verified.

### Documentation

* [ ] Architecture documentation complete.
* [ ] Database documentation complete.
* [ ] API documentation complete.
* [ ] Security documentation complete.
* [ ] Testing documentation complete.
* [ ] AI development rules complete.
* [ ] Roadmap updated.

---

# 16. Milestones

The project should use the following milestones.

## M0 — Specification Complete

```text
Product
Business Rules
Technical Design
Design System
Development Rules
```

are sufficiently defined.

---

## M1 — Technical Foundation

```text
Mobile
+
Backend
+
PostgreSQL
+
API
```

communicate successfully.

---

## M2 — Authentication Complete

Users can securely access their own PocketPal account.

---

## M3 — Personal Finance Complete

Users can manage:

```text
Income
Expenses
Categories
Balance
Goals
Contributions
```

---

## M4 — Customer Management Complete

Users can manage customers and references.

---

## M5 — Financial Engine Validated

Loan calculations are deterministic and covered by automated tests.

This is a critical milestone.

---

## M6 — Loan Management Complete

Users can:

```text
Create loans
View schedules
Monitor installments
Track balances
```

---

## M7 — Payment System Complete

Users can:

```text
Register payments
Make partial payments
View payment history
```

and the backend correctly allocates every payment.

---

## M8 — Collections Complete

Users can identify:

```text
Today's collections
Upcoming payments
Overdue payments
```

and register payments from the collection workflow.

---

## M9 — Dashboard Complete

The application provides a unified financial overview.

---

## M10 — Release Candidate

All critical v1.0 functionality is implemented and tested.

---

## M11 — PocketPal v1.0

The first controlled production version is ready.

---

# 17. Feature Development Workflow

Every feature should follow this sequence:

```text
1. Understand requirement
        ↓
2. Identify business rules
        ↓
3. Identify affected entities
        ↓
4. Update technical design if necessary
        ↓
5. Update database if necessary
        ↓
6. Implement backend domain logic
        ↓
7. Implement API
        ↓
8. Write tests
        ↓
9. Implement mobile UI
        ↓
10. Integrate
        ↓
11. Test end-to-end
        ↓
12. Document
```

Financial features should never begin with UI implementation alone.

---

# 18. Backend-First Rule for Financial Features

For financially sensitive functionality, development should generally proceed as:

```text
Business Rule
      ↓
Domain Logic
      ↓
Calculator / Service
      ↓
Unit Tests
      ↓
Database
      ↓
API
      ↓
Integration Tests
      ↓
Mobile UI
```

This prevents the frontend from becoming the source of financial logic.

---

# 19. Dependency Rules

Features must respect their dependencies.

For example:

```text
Authentication
      ↓
User isolation
      ↓
Customers
      ↓
Loans
      ↓
Installments
      ↓
Payments
      ↓
Collections
      ↓
Loan Dashboard
```

Likewise:

```text
Transactions
      ↓
Balance
      ↓
Financial Dashboard
```

and:

```text
Goals
      ↓
Contributions
      ↓
Goal Progress
      ↓
Financial Dashboard
```

A dependent feature should not be considered complete if its required upstream domain is unstable.

---

# 20. Vertical Slice Strategy

After the foundation is stable, development should favor vertical slices rather than implementing every layer independently for a long period.

Example:

```text
Customer Creation

Database
   ↓
Model
   ↓
Repository
   ↓
Service
   ↓
API
   ↓
Validation
   ↓
Mobile Form
   ↓
Mobile List
   ↓
Tests
```

A vertical slice should produce usable functionality.

---

# 21. Financial Feature Gate

Financially sensitive features require an additional validation gate.

Before integration into the application:

```text
Business Rule
      ↓
Expected Example
      ↓
Implementation
      ↓
Automated Test
      ↓
Edge Cases
      ↓
Review
```

Examples:

* interest calculation;
* amortization;
* late fees;
* payment allocation;
* partial payments;
* principal recovery.

No financially sensitive feature should be considered complete based solely on manual UI testing.

---

# 22. Testing Strategy Across the Roadmap

Testing must grow together with the application.

## Foundation

* configuration tests;
* health endpoint tests.

## Authentication

* registration;
* login;
* invalid credentials;
* protected routes;
* token validation.

## Personal Finance

* transaction validation;
* balance;
* categories;
* goals;
* contributions.

## Loan Engine

* calculations;
* dates;
* rounding;
* interest;
* amortization;
* late fees.

## Payments

* allocation;
* partial payments;
* multiple installments;
* reversals;
* balances.

## Collections

* date filters;
* overdue detection;
* collection totals.

## Dashboard

* metric calculations;
* API integration;
* empty states.

Detailed testing requirements belong to:

```text
docs/development/TESTING.md
```

---

# 23. Git and Development Strategy

Development should be organized into small, reviewable changes.

Recommended structure:

```text
feature/authentication
feature/transactions
feature/customers
feature/loan-engine
feature/loans
feature/payments
feature/collections
feature/dashboard
```

Commit messages should clearly describe the change.

Examples:

```text
feat(auth): implement user registration
feat(finance): add expense creation
feat(customers): add customer management
feat(loans): implement fixed principal calculator
feat(payments): implement payment allocation
test(loans): add amortization edge cases
fix(payments): prevent duplicate allocation
```

The exact Git workflow may be refined by the development team.

---

# 24. Scope Control

Features outside the v1.0 specification must not automatically enter the roadmap.

Before accepting a new feature, evaluate:

1. What user problem does it solve?
2. Is it part of v1.0?
3. What business rules does it introduce?
4. What entities does it affect?
5. Does it affect financial calculations?
6. Does it affect database structure?
7. Does it affect API contracts?
8. What tests are required?
9. Does it introduce security concerns?
10. Does it delay a higher-priority milestone?

Potential future features include:

```text
Multi-currency
Bank integrations
Payment gateways
Digital wallet
Credit scoring
Credit bureau integration
Refinancing
Business accounting
Multi-company management
```

These remain outside the v1.0 roadmap unless the product specification is explicitly changed.

---

# 25. Change Management

If a requirement changes during development:

```text
Requirement Change
       ↓
Impact Analysis
       ↓
Business Rule Review
       ↓
Technical Impact
       ↓
Database Impact
       ↓
API Impact
       ↓
UI Impact
       ↓
Testing Impact
       ↓
Documentation Update
```

Changes to financial rules require additional caution.

A rule that changes the financial meaning of existing data must include:

* migration strategy;
* compatibility analysis;
* historical-data impact;
* recalculation strategy where applicable;
* regression tests.

---

# 26. Technical Debt Policy

Technical debt may be accepted when:

* it does not compromise financial correctness;
* it does not create a significant security vulnerability;
* it is documented;
* there is a plan to resolve it.

Technical debt must not be used to justify:

* incorrect financial calculations;
* insecure authentication;
* loss of payment history;
* inconsistent balances;
* untraceable financial operations.

---

# 27. Definition of Done

A feature is considered complete when:

* business requirements are satisfied;
* business rules are respected;
* inputs are validated;
* backend logic is implemented;
* database changes are complete;
* API endpoints work;
* mobile integration works;
* automated tests exist where appropriate;
* edge cases are handled;
* loading states exist where applicable;
* empty states exist where applicable;
* error states are implemented;
* security requirements are satisfied;
* no secrets are committed;
* documentation is updated.

For financial functionality, the feature must additionally satisfy:

* deterministic calculations;
* exact decimal arithmetic;
* historical traceability;
* correct rounding;
* correct state transitions;
* no double counting;
* appropriate auditability.

---

# 28. Release Criteria for v1.0

PocketPal v1.0 should not be released until the following critical areas are stable:

```text
Authentication
Personal Finance
Customers
Loans
Installments
Payments
Collections
Dashboard
Security
Testing
```

The financial engine is the most critical release dependency.

A visually complete application with unvalidated financial calculations must not be considered release-ready.

---

# 29. Post-v1.0 Roadmap

After v1.0, future development can be evaluated in separate iterations.

Potential areas:

## Financial Intelligence

* advanced reports;
* financial trends;
* cash-flow analysis;
* portfolio analytics.

## Lending Intelligence

* customer performance;
* repayment history;
* loan profitability;
* collection analytics.

## Automation

* reminders;
* recurring transactions;
* recurring collections;
* scheduled reports.

## Integrations

* bank integrations;
* payment providers;
* external financial services.

## Advanced Lending

* refinancing;
* restructuring;
* credit scoring;
* more amortization models.

These features require a new prioritization process and must not be assumed to belong to v1.0.

---

# 30. Roadmap Summary

The complete implementation path is:

```text
┌───────────────────────────────┐
│ Phase 0 — Specification       │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 1 — Foundation          │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 2 — Authentication      │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 3 — Personal Finance    │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 4 — Customers           │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 5 — Loan Engine         │
│        ★ Critical Gate        │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 6 — Loans               │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 7 — Payments            │
│        ★ Critical Gate        │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 8 — Collections         │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 9 — Dashboard            │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 10 — Quality             │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Phase 11 — PocketPal v1.0     │
└───────────────────────────────┘
```

The central development principle is:

> **Build the financial core first, validate it thoroughly, and then expose it through the application.**

PocketPal should prioritize correctness, traceability and maintainability over rapid feature accumulation.

---

# 31. Current Development Status

Updated: 2026-08-23.

## Documentation

```text
Product Specification     COMPLETE
Financial Rules           COMPLETE
Loan Rules                COMPLETE
Payment Rules             COMPLETE
Architecture              COMPLETE
Database                  COMPLETE
API                       COMPLETE
Security                  COMPLETE
UI/UX                     COMPLETE
Design System             COMPLETE
Roadmap                   COMPLETE
Testing                   COMPLETE
AI Development Rules      COMPLETE
AI Master Prompt          COMPLETE
```

## Implementation

```text
Phase 1  Foundation        COMPLETE (verified — see DEVELOPMENT_PLAN.md)
Phase 2  Authentication    COMPLETE (verified — see DEVELOPMENT_PLAN.md)
Phase 3  Personal Finance  COMPLETE (verified — see DEVELOPMENT_PLAN.md)
Phase 4  Customers         COMPLETE (verified — see DEVELOPMENT_PLAN.md)
Phase 5  Loan Engine       COMPLETE (gate M5 passed — see DEVELOPMENT_PLAN.md)
Phase 6  Loans             COMPLETE (verified — see DEVELOPMENT_PLAN.md)
Phase 7  Payments          NOT STARTED   ★ critical gate
Phase 8  Collections       COMPLETE (verified — see DEVELOPMENT_PLAN.md)
Phase 9  Dashboard         COMPLETE (verified — see DEVELOPMENT_PLAN.md)
Phase 10 Quality            COMPLETE (verified — see DEVELOPMENT_PLAN.md)
Phase 11 Release            COMPLETE (v1.0-rc — checklist executed)
```

Task-level tracking lives in:

```text
docs/development/DEVELOPMENT_PLAN.md
```
