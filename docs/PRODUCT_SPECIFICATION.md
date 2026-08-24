# PocketPal — Product Specification

**Version:** 1.0
**Status:** Official Product Specification
**Product type:** Mobile application
**Primary domains:** Personal Finance & Personal Loan Management
**Date:** 2026-08-21

---

# 1. Product Overview

PocketPal is a mobile application designed to centralize two complementary financial activities in a single platform:

1. Personal finance management.
2. Personal loan management.

The application allows users to track their personal income, expenses, financial goals and categories while also managing customers, loans, installments, interest, late fees, payments and collections.

PocketPal is designed primarily for individuals who want a simple personal finance system and who may also operate as personal lenders.

The application is not intended to hold, transfer or custody money. Its primary purpose is to provide financial registration, calculation, monitoring, organization and analysis.

---

# 2. Product Vision

PocketPal aims to become a centralized financial control tool where a user can understand their personal financial situation and their lending portfolio without depending on spreadsheets, notes or multiple disconnected applications.

The application should make it possible to answer important financial questions quickly.

## Personal finance

* How much money have I received?
* How much have I spent?
* What is my current balance?
* What categories consume the most money?
* How much have I saved toward each goal?
* How is my financial situation evolving?

## Loans

* How much money have I lent?
* How much capital is still outstanding?
* How much interest have I generated?
* How much interest have I collected?
* How much should I collect today?
* Who is overdue?
* How much is overdue?
* How much corresponds to late fees?
* Which customers have active loans?

---

# 3. Problem Statement

Individuals who manage personal finances and lend money privately often rely on multiple disconnected tools.

Typical tools include:

* spreadsheet applications;
* notes;
* calendars;
* messaging applications;
* calculators;
* personal finance applications;
* separate customer records.

This fragmentation creates several problems:

* forgotten collections;
* incorrect interest calculations;
* lost customer information;
* difficulty tracking overdue installments;
* incorrect late-fee calculations;
* lack of visibility into outstanding capital;
* inability to quickly determine total money owed;
* difficulty distinguishing available personal money from money currently lent to others.

PocketPal addresses this problem by combining personal financial management and loan portfolio management in one application.

---

# 4. Target User

The initial target user is an individual who:

* manages personal income and expenses;
* wants to establish financial goals;
* lends money personally;
* needs to manage customers;
* needs to calculate and monitor loans;
* needs to track installments and payments;
* needs to monitor overdue obligations and collections.

The architecture should allow future support for additional user types without requiring a complete redesign.

---

# 5. Product Scope

PocketPal v1.0 includes the following functional areas.

## 5.1 Personal Finance

* Income management.
* Expense management.
* Categories.
* Financial balance.
* Financial goals.
* Goal contributions.
* Transaction history.
* Financial dashboard.

## 5.2 Loan Management

* Customer management.
* Customer references.
* Loan creation.
* Interest configuration.
* Amortization schedules.
* Installments.
* Payments.
* Partial payments.
* Late fees.
* Overdue installments.
* Today's collections.
* General collections.
* Loan history.
* Loan dashboard.

## 5.3 Platform

* User authentication.
* User-specific data isolation.
* REST API.
* PostgreSQL persistence.
* Mobile application.
* Light mode.
* Dark mode.
* Form validation.
* Error handling.
* Testing.
* Basic auditing.

---

# 6. Out of Scope for v1.0

The following features are intentionally excluded from the initial version:

* Credit products.
* Product financing.
* Marketplace functionality.
* Digital wallet.
* Money custody.
* Bank transfers.
* Bank integrations.
* Payment gateways.
* External credit scoring.
* Credit bureau reporting.
* Advanced refinancing.
* Business accounting.
* Multi-company management.

These features may be evaluated for future versions.

---

# 7. Main Product Modules

PocketPal is organized into the following modules:

1. Dashboard.
2. Personal Finance.
3. Loans.
4. Customers.
5. Financial Goals.
6. Reports.
7. Settings.

---

# 8. Dashboard

The Dashboard is the main screen of PocketPal.

Its purpose is to provide an immediate overview of the user's financial situation.

The dashboard must combine personal finance and loan portfolio information without overwhelming the user.

---

## 8.1 Personal Finance Dashboard

Display:

* Current balance.
* Monthly income.
* Monthly expenses.
* Financial goals.
* Goal progress.

Initial visualizations:

* Income vs expenses.
* Expenses by category.
* Balance evolution.

---

## 8.2 Loan Dashboard

Display:

* Total capital lent.
* Outstanding capital.
* Generated interest.
* Collected interest.
* Today's collections.
* Total receivable.
* Total overdue.

Potential visualizations:

* Capital lent vs outstanding capital.
* Collected vs receivable.
* Generated interest vs collected interest.

Visual references supplied for the project may be used as conceptual inspiration, but the final UI must be original.

---

# 9. Personal Finance Module

The Personal Finance module manages the user's own financial movements.

It consists of:

* Income.
* Expenses.
* Categories.
* Balance.
* Financial goals.
* Transaction history.

---

# 10. Transactions

A transaction represents a personal financial movement.

Transaction types:

```text
INCOME
EXPENSE
```

A transaction contains:

```text
id
type
amount
category
date
description
payment_method
notes
created_at
updated_at
```

All monetary values must use exact decimal arithmetic.

Floating-point arithmetic must not be used for monetary calculations.

---

# 11. Income

Initial income categories:

* Salary.
* Freelance.
* Business.
* Interest.
* Other.

An income record must support:

* amount;
* category;
* date;
* description;
* receiving method;
* notes.

Categories must be extensible.

---

# 12. Expenses

Initial expense categories:

* Food.
* Transportation.
* Housing.
* Utilities.
* Education.
* Health.
* Entertainment.
* Shopping.
* Technology.
* Debt.
* Other.

An expense record must support:

* amount;
* category;
* date;
* description;
* payment method;
* notes.

Categories must be extensible.

---

# 13. Financial Balance

The basic personal finance balance is:

```text
Balance = Total Income - Total Expenses
```

Loan-related financial movements must be handled carefully to avoid double counting.

Money received from a loan payment can contain different financial components:

```text
Principal recovered
Interest received
Late fee received
```

The integration between the loan system and personal finance system must preserve the distinction between these concepts.

Detailed accounting behavior will be formally defined in:

```text
docs/business/FINANCIAL_RULES.md
```

---

# 14. Financial Goals

A financial goal represents a monetary objective.

Examples:

* Buy a computer.
* Save for education.
* Build an emergency fund.
* Save for a trip.

A goal contains:

```text
id
name
target_amount
current_amount
target_date
description
status
created_at
updated_at
```

The application must display:

* target amount;
* current amount;
* remaining amount;
* progress percentage;
* target date.

---

# 15. Goal Contributions

Contributions must be stored as independent historical records.

A goal's current amount must not be modified without recording the corresponding contribution.

Conceptual entity:

```text
GoalContribution
```

This preserves traceability.

---

# 16. Customer Module

The Customer module manages people who receive loans from the user.

## Basic information

A customer may have:

* full name;
* identification/document number;
* phone;
* alternative phone;
* email;
* address;
* notes.

---

# 17. Customer References

A customer may have a personal reference.

Reference information:

* name;
* phone;
* address;
* relationship;
* notes.

References are informational and do not constitute an external credit verification system.

---

# 18. Customer Financial Summary

The customer detail screen should provide a financial summary.

Display:

* active loans;
* total capital lent;
* outstanding capital;
* total receivable;
* total overdue;
* payment history;
* loan status.

This allows the user to understand the relationship with a customer without opening every individual loan.

---

# 19. Loan Module

A loan belongs to a customer.

A loan contains:

```text
id
client_id
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
status
created_at
updated_at
```

The detailed financial behavior of loans will be defined in:

```text
docs/business/LOAN_RULES.md
```

---

# 20. Amortization Types

PocketPal v1.0 supports:

```text
FIXED_PRINCIPAL
FRENCH
```

## Fixed Principal

The original principal is distributed across the installments.

Example:

```text
Principal: $1,000,000
Installments: 10
Principal per installment: $100,000
```

Interest is calculated using the outstanding principal balance according to the configured interest rules.

The final installment must account for any rounding difference.

---

## French Amortization

The periodic payment should remain approximately constant.

Each installment must be separated into:

```text
total_payment
principal
interest
remaining_balance
```

Internal calculations must maintain decimal precision.

Rounding rules must be applied consistently.

---

# 21. Payment Frequencies

Initial supported frequencies:

```text
ONCE
DAILY
WEEKLY
BIWEEKLY
MONTHLY
CUSTOM
```

The frequency determines installment due dates.

The date engine must correctly handle:

* month transitions;
* February;
* leap years;
* year transitions.

---

# 22. Interest Configuration

A loan must store:

* interest rate;
* interest period.

Conceptual example:

```text
Rate: 10%
Period: Monthly
```

The system must avoid ambiguous interest definitions.

The combination of rate and period determines how interest is applied to the loan schedule.

Detailed interest rules belong to:

```text
docs/business/LOAN_RULES.md
```

---

# 23. Late Fees

Late fees are independent from ordinary interest.

A late-fee configuration contains:

```text
enabled
type
value
grace_period_days
```

Supported initial types:

```text
FIXED_AMOUNT
PERCENTAGE
DAILY_PERCENTAGE
```

A financial obligation may therefore contain:

```text
principal
interest
late_fee
```

Late fees must not automatically generate compound interest.

Detailed late-fee behavior belongs to:

```text
docs/business/LOAN_RULES.md
docs/business/PAYMENT_RULES.md
```

---

# 24. Installments

Every loan generates an installment schedule.

An installment conceptually contains:

```text
id
loan_id
installment_number
due_date

principal_due
interest_due
late_fee_due
total_due

principal_paid
interest_paid
late_fee_paid

remaining_balance
status

created_at
updated_at
```

Initial installment states:

```text
PENDING
PARTIAL
PAID
OVERDUE
CANCELLED
```

The backend is responsible for determining financial state.

The frontend must not independently decide whether an installment is paid or overdue.

---

# 25. Payments

A loan payment records money received from a customer.

A payment contains:

```text
id
loan_id
client_id
amount
payment_date
payment_method
notes
created_at
```

Payments must preserve historical records.

Financial payments must not be physically deleted.

If a correction is required, the system should use an explicit reversal or adjustment mechanism rather than silently modifying history.

Detailed payment rules belong to:

```text
docs/business/PAYMENT_RULES.md
```

---

# 26. Payment Allocation

The initial recommended allocation order is:

```text
1. Late fee
2. Interest
3. Principal
```

Example obligation:

```text
Principal: $100,000
Interest: $20,000
Late fee: $5,000

Total: $125,000
```

If the customer pays:

```text
$80,000
```

the backend must allocate the amount according to the defined payment rules and preserve the remaining balances.

The installment becomes:

```text
PARTIAL
```

when a balance remains.

Payment allocation must always be deterministic and auditable.

---

# 27. Partial Payments

PocketPal must support partial payments.

A partial payment must:

* preserve the original payment;
* update the corresponding balances;
* preserve payment history;
* update installment status;
* update loan balances.

The system must also support a payment that covers multiple installments, provided the allocation rules explicitly determine how the amount is distributed.

---

# 28. Loan Status

Initial loan statuses:

```text
ACTIVE
PAID
OVERDUE
CANCELLED
```

A loan may be considered overdue when it contains outstanding obligations past their due date.

A paid loan must have all required obligations settled.

---

# 29. Today's Collections

PocketPal must provide a dedicated collection view for the current day.

Each collection should show:

* customer;
* loan;
* installment;
* due date;
* expected amount;
* amount already paid;
* outstanding amount;
* days overdue;
* late fee;
* status.

Summary metrics:

```text
Expected today
Collected today
Pending today
Overdue
```

Conceptual endpoint:

```text
GET /loans/collections/today
```

---

# 30. General Collections

The collection system must support filters:

```text
TODAY
THIS_WEEK
THIS_MONTH
OVERDUE
UPCOMING
ALL
```

Collections can be grouped by:

* customer;
* date;
* loan;
* status.

The goal is to allow the user to identify what needs to be collected and when.

---

# 31. Mobile Navigation

The main navigation is:

```text
Inicio
Finanzas
Préstamos
Clientes
Más
```

## Inicio

Dashboard.

## Finanzas

* Income.
* Expenses.
* Goals.
* Categories.

## Loans

* Active loans.
* Today's collections.
* Receivables.
* Overdue.
* History.

## Customers

* Customer list.
* Search.
* Customer details.

## More

* Reports.
* Settings.
* Profile.

---

# 32. UI/UX Principles

PocketPal must have a:

* modern;
* minimal;
* professional;
* mobile-first;
* clear;
* consistent

interface.

The product must not visually copy CrediManager or another existing application.

Provided screenshots are references for understanding desired functionality and information architecture.

Detailed design decisions belong to:

```text
docs/design/UI_UX.md
docs/design/DESIGN_SYSTEM.md
```

---

# 33. Visual Status System

Initial semantic colors:

```text
Green  = paid / positive
Yellow = upcoming / warning
Red    = overdue / negative
Blue   = primary action
```

The exact color tokens will be defined in:

```text
docs/design/DESIGN_SYSTEM.md
```

---

# 34. Required UI States

The application must support:

* loading states;
* empty states;
* error states;
* success feedback;
* validation errors;
* confirmation dialogs;
* disabled states;
* offline/error recovery states where applicable.

---

# 35. Themes

PocketPal must support:

* Light mode.
* Dark mode.

Theme implementation must use centralized design tokens rather than hard-coded colors throughout the application.

---

# 36. Technology Stack

## Mobile

```text
React Native
Expo
TypeScript
Expo Router
TanStack Query
Zustand
React Hook Form
Zod
```

## Backend

```text
Python
FastAPI
SQLAlchemy 2
Alembic
Pydantic
PostgreSQL
JWT
```

Technical implementation details are defined in:

```text
docs/technical/ARCHITECTURE.md
docs/technical/DATABASE.md
docs/technical/API.md
docs/technical/SECURITY.md
```

---

# 37. Core Architecture

The project is initially divided into:

```text
/mobile
/backend
```

Mobile structure:

```text
app/
components/
features/
services/
stores/
hooks/
types/
utils/
```

Backend structure:

```text
app/
    api/
    core/
    models/
    schemas/
    services/
    repositories/
    calculators/
    db/
    tests/
```

Financial calculation logic must be isolated from API and UI code.

The financial calculation layer should reside conceptually in:

```text
backend/app/calculators/
```

---

# 38. Main Data Entities

The main domain entities are:

```text
User
Client
ClientReference

Loan
LoanInstallment
LoanPayment
LateFee

Category
Transaction

FinancialGoal
GoalContribution

AuditLog
```

The detailed database model belongs to:

```text
docs/technical/DATABASE.md
```

---

# 39. Data Integrity

PocketPal must prioritize financial data integrity.

Mandatory principles:

1. Never use floating-point numbers for money.
2. Use decimal arithmetic.
3. Never physically delete relevant financial payment history.
4. Preserve transaction history.
5. Perform financial calculations on the backend.
6. Preserve installment history.
7. Partial payments must remain traceable.
8. Outstanding principal must never become negative.
9. Paid installments cannot silently become pending.
10. Important financial operations must be auditable.
11. Rounding must be deterministic.
12. Relevant financial operations should be idempotent.
13. Concurrent operations must prevent duplicate payment application.

---

# 40. Security

The initial security model includes:

* JWT authentication;
* password hashing;
* protected endpoints;
* server-side validation;
* user-level data isolation;
* environment variables;
* secret management.

Passwords must never be stored in plaintext.

Secrets must never be committed to source control.

Detailed security rules belong to:

```text
docs/technical/SECURITY.md
```

---

# 41. Testing Requirements

The financial engine must have automated tests before being considered production-ready.

Minimum coverage areas:

## Fixed principal

* one installment;
* two installments;
* ten installments;
* rounding;
* final installment.

## French amortization

* one installment;
* three installments;
* twelve installments;
* different interest rates.

## Payments

* full payment;
* partial payment;
* payment greater than one installment;
* payment covering multiple installments;
* overdue payment.

## Late fees

* no late fee;
* grace period;
* daily late fee;
* percentage late fee.

## Dates

* month transition;
* February;
* leap year;
* year transition.

Detailed testing strategy belongs to:

```text
docs/development/TESTING.md
```

---

# 42. Development Roadmap

PocketPal will be developed incrementally.

## Phase 1 — Foundation

* repository;
* React Native;
* Expo;
* TypeScript;
* FastAPI;
* PostgreSQL;
* SQLAlchemy;
* Alembic;
* Docker;
* environment configuration;
* frontend/backend communication;
* health endpoint.

## Phase 2 — Authentication

* registration;
* login;
* logout;
* refresh token;
* protected routes.

## Phase 3 — Personal Finance

* categories;
* income;
* expenses;
* balance;
* financial dashboard.

## Phase 4 — Customers

* customer list;
* creation;
* editing;
* details;
* references;
* search.

## Phase 5 — Loan Engine

* domain models;
* financial calculators;
* tests;
* endpoints;
* mathematical validation.

This phase must be validated before building the complete loan UI.

## Phase 6 — Loans

* creation;
* schedules;
* installments;
* interest;
* late fees;
* statuses.

## Phase 7 — Payments

* full payments;
* partial payments;
* payment allocation;
* history;
* installment updates;
* loan balance updates.

## Phase 8 — Collections

* today's collections;
* upcoming collections;
* overdue collections;
* general collections;
* filters;
* quick payment registration.

## Phase 9 — Dashboard

* personal finance metrics;
* loan metrics;
* charts;
* combined financial overview.

## Phase 10 — Refinement

* dark mode;
* animations;
* empty states;
* skeleton loaders;
* error handling;
* confirmations;
* accessibility;
* responsive behavior.

The detailed roadmap belongs to:

```text
docs/development/ROADMAP.md
```

---

# 43. Product Principles

PocketPal follows these principles.

## Simplicity

The application should solve the user's financial problems without unnecessary complexity.

## Accuracy

Financial calculations must prioritize correctness over implementation speed.

## Traceability

Important financial operations must be historically reconstructable.

## Separation of responsibilities

UI, API, persistence and financial calculations must remain separated.

## Backend as financial source of truth

The backend determines financial results.

The frontend presents information and requests operations.

## Testability

Financial logic must be testable independently from the UI.

## Extensibility

The architecture must allow future functionality without requiring a complete rewrite.

---

# 44. Scope Control

A feature should not be added merely because it is technically interesting.

Before adding a new feature, determine:

1. What problem does it solve?
2. Is it inside the current product scope?
3. What entities does it affect?
4. What business rules does it introduce?
5. What impact does it have on financial integrity?
6. What tests does it require?

Features outside the current scope must be documented for future consideration.

---

# 45. Definition of Done

A feature is considered complete when:

* it works correctly;
* inputs are validated;
* errors are handled;
* business logic has appropriate tests;
* it works against PostgreSQL;
* it works through the API;
* it is integrated into the mobile application;
* existing functionality remains functional;
* loading/error/empty states are implemented where applicable;
* it follows the project architecture;
* it contains no secrets;
* relevant decisions are documented.

---

# 46. Documentation Structure

PocketPal documentation is organized as follows:

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

`PRODUCT_SPECIFICATION.md` is the principal product document.

Specialized documents must complement this specification.

If a specialized document conflicts with the product specification, the conflict must be resolved explicitly instead of silently choosing one version.

---

# 47. Versioning

This document represents:

```text
PocketPal Product Specification v1.0
```

Major product changes should result in a new specification version.

Examples:

```text
v1.1 = minor functional clarification
v1.2 = additional compatible functionality
v2.0 = major product/architecture change
```

Business-critical rules must not be changed silently.

---

# 48. Current Product Status

Updated: 2026-08-23.

PocketPal v1.0 is feature-complete and in **release-candidate** state.

```text
Implementation phases 1-10   COMPLETE (verified — docs/development/DEVELOPMENT_PLAN.md)
Release preparation          COMPLETE (checklist executed — same document)
```

Delivered scope matches this specification:

* Personal finance: categories (seeded), income/expenses, balance rules,
  goals with traceable contributions.
* Lending: customers + references, loans with persisted engine-generated
  schedules (fixed principal / French), late fees, payments with official
  allocation order, reversals, daily collections.
* Platform: JWT auth, user isolation, audit trail, rate limiting,
  security headers, consolidated dashboard.

Out-of-scope items listed in §6 remain excluded. Post-v1.0 candidates
(including /reports/* endpoints) are recorded in
`docs/development/DEVELOPMENT_PLAN.md`.

