# PocketPal — System Architecture

**Version:** 1.0
**Status:** Official Technical Architecture
**Domain:** Application Architecture
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`

---

# 1. Purpose

This document defines the technical architecture of PocketPal.

Its purpose is to establish how the application is structured, how its components communicate, where business logic is executed, and how responsibilities are separated between the mobile application, backend, database and financial calculation engine.

The architecture must support the functional requirements defined in:

```text
docs/PRODUCT_SPECIFICATION.md
```

and the financial rules defined in:

```text
docs/business/FINANCIAL_RULES.md
docs/business/LOAN_RULES.md
docs/business/PAYMENT_RULES.md
```

The architecture prioritizes:

* financial correctness;
* separation of responsibilities;
* maintainability;
* testability;
* security;
* scalability;
* traceability;
* predictable behavior.

---

# 2. Architectural Principles

PocketPal follows the following architectural principles.

## 2.1 Separation of Responsibilities

Each layer must have a clearly defined responsibility.

The main separation is:

```text
Mobile Application
        ↓
REST API
        ↓
Application Services
        ↓
Domain / Financial Engine
        ↓
Persistence
        ↓
PostgreSQL
```

A layer must not assume responsibilities that belong to another layer.

---

## 2.2 Backend as Source of Truth

The backend is the authoritative source for:

* financial calculations;
* loan balances;
* installment status;
* payment allocation;
* interest;
* late fees;
* outstanding principal;
* financial balances.

The frontend must never independently determine authoritative financial results.

The mobile application only presents information received from the backend and requests operations through the API.

---

## 2.3 Financial Logic Isolation

Financial calculations must be isolated from:

* HTTP controllers;
* database models;
* React Native components;
* UI state;
* API serialization.

Financial logic should reside conceptually in:

```text
backend/app/calculators/
```

and supporting domain services.

This allows financial calculations to be tested independently.

---

## 2.4 Exact Monetary Arithmetic

All monetary calculations must use decimal arithmetic.

The architecture must never use floating-point arithmetic as the authoritative representation of money.

This requirement originates from the financial business rules.

---

## 2.5 User Data Isolation

Every user must have access only to their own financial data.

User ownership must be enforced on the backend.

The frontend must not be trusted to enforce data isolation.

---

## 2.6 API-First Communication

The mobile application communicates with the backend through a REST API.

The mobile application must not connect directly to PostgreSQL.

The architecture is therefore:

```text
React Native
     │
     │ HTTPS
     ▼
FastAPI
     │
     ▼
Application Services
     │
     ▼
Repositories
     │
     ▼
PostgreSQL
```

---

# 3. High-Level Architecture

PocketPal uses a layered client-server architecture.

```text
┌───────────────────────────────────────────────┐
│                Mobile Application             │
│                                               │
│ React Native + Expo + TypeScript              │
│                                               │
│ UI / Features / Stores / API Client           │
└───────────────────────┬───────────────────────┘
                        │
                        │ HTTPS / REST
                        ▼
┌───────────────────────────────────────────────┐
│                  Backend API                  │
│                                               │
│ FastAPI                                       │
│ Authentication / Validation / HTTP            │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│             Application Services              │
│                                               │
│ Transactions / Loans / Payments / Goals      │
│ Customers / Collections                       │
└───────────────────────┬───────────────────────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
┌───────────────────────┐  ┌────────────────────┐
│ Financial Engine      │  │ Repositories       │
│                       │  │                    │
│ Interest              │  │ Data access        │
│ Amortization          │  │ Persistence logic  │
│ Payment allocation    │  │                    │
│ Late fees             │  │                    │
│ Date calculations     │  │                    │
└───────────────────────┘  └─────────┬──────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   PostgreSQL     │
                            │                  │
                            │ Persistent data  │
                            └──────────────────┘
```

---

# 4. Technology Stack

## 4.1 Mobile

The mobile application uses:

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

Responsibilities include:

* rendering the interface;
* collecting user input;
* local UI state;
* navigation;
* form validation;
* API communication;
* displaying backend results;
* loading states;
* error states;
* user interaction.

The mobile application must not contain authoritative financial calculations.

---

# 5. Backend

The backend uses:

```text
Python
FastAPI
SQLAlchemy 2
Alembic
Pydantic
PostgreSQL
JWT
```

The backend is responsible for:

* authentication;
* authorization;
* validation;
* business operations;
* financial calculations;
* loan calculations;
* payment allocation;
* persistence;
* transaction consistency;
* auditability;
* API responses.

---

# 6. Database

PocketPal uses:

```text
PostgreSQL
```

PostgreSQL is the persistent source of application data.

The database stores:

* users;
* clients;
* references;
* loans;
* installments;
* payments;
* categories;
* transactions;
* financial goals;
* goal contributions;
* audit records.

The detailed relational model is defined in:

```text
docs/technical/DATABASE.md
```

---

# 7. Backend Layer Architecture

The backend follows a layered architecture.

```text
app/
│
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

Each directory has a specific responsibility.

---

# 8. API Layer

The API layer is responsible for HTTP communication.

Location:

```text
backend/app/api/
```

Responsibilities:

* define routes;
* receive HTTP requests;
* authenticate requests;
* validate request schemas;
* call application services;
* serialize responses;
* return appropriate HTTP status codes.

The API layer must not contain complex financial calculations.

Example:

```text
POST /loans/{loan_id}/payments
```

The endpoint should:

1. authenticate the user;
2. validate the request;
3. call the payment service;
4. return the resulting operation.

It should not implement payment allocation directly inside the route handler.

---

# 9. Core Layer

Location:

```text
backend/app/core/
```

The core layer contains application-wide infrastructure and configuration.

Potential responsibilities:

* configuration;
* security;
* authentication;
* JWT;
* password hashing;
* application constants;
* dependency injection;
* logging.

Example structure:

```text
core/
├── config.py
├── security.py
├── dependencies.py
└── logging.py
```

---

# 10. Models Layer

Location:

```text
backend/app/models/
```

Models represent persistent database entities.

Examples:

```text
User
Client
ClientReference
Loan
LoanInstallment
LoanPayment
Category
Transaction
FinancialGoal
GoalContribution
AuditLog
```

Models define persistence structure.

They must not become the main location for complex financial calculations.

---

# 11. Schemas Layer

Location:

```text
backend/app/schemas/
```

Pydantic schemas define API input and output contracts.

Example:

```text
LoanCreate
LoanResponse
PaymentCreate
PaymentResponse
TransactionCreate
TransactionResponse
```

Schemas are responsible for:

* request validation;
* response serialization;
* API contracts;
* type validation.

Schemas must not replace domain services.

---

# 12. Services Layer

Location:

```text
backend/app/services/
```

Services coordinate application operations.

Examples:

```text
loan_service.py
payment_service.py
transaction_service.py
goal_service.py
client_service.py
collection_service.py
```

A service may coordinate:

```text
API
 ↓
Service
 ├── Calculator
 ├── Repository
 └── Audit
```

Services are responsible for application workflows rather than low-level persistence.

---

# 13. Repository Layer

Location:

```text
backend/app/repositories/
```

Repositories encapsulate database access.

Examples:

```text
loan_repository.py
payment_repository.py
client_repository.py
transaction_repository.py
goal_repository.py
```

Responsibilities include:

* querying records;
* creating records;
* updating records;
* retrieving relationships;
* persistence operations.

Repositories must not contain UI logic.

Complex financial calculations should not be placed inside repositories.

---

# 14. Financial Calculator Layer

Location:

```text
backend/app/calculators/
```

This is one of the most important architectural components of PocketPal.

The calculator layer contains deterministic financial algorithms.

Potential modules:

```text
interest.py
amortization.py
late_fees.py
payment_allocation.py
dates.py
rounding.py
```

The calculator layer should preferably operate on explicit inputs and produce explicit outputs.

Example:

```text
calculate_fixed_principal_schedule(...)
calculate_french_schedule(...)
calculate_interest(...)
calculate_late_fee(...)
allocate_payment(...)
```

---

# 15. Financial Engine Requirements

Financial calculators must be:

* deterministic;
* independently testable;
* free from HTTP dependencies;
* free from React Native dependencies;
* independent from UI state;
* independent from authentication;
* explicit about inputs;
* explicit about outputs.

Example conceptual flow:

```text
Loan configuration
        ↓
Financial Calculator
        ↓
Amortization Schedule
        ↓
Loan Service
        ↓
Repository
        ↓
PostgreSQL
```

---

# 16. Database Layer

Location:

```text
backend/app/db/
```

Responsibilities include:

* database connection;
* SQLAlchemy configuration;
* session management;
* migrations integration;
* transaction management.

The database layer should provide controlled access to PostgreSQL.

---

# 17. Transaction Boundaries

Financial operations that modify multiple records must execute inside a database transaction.

Example payment registration:

```text
BEGIN
    Create payment
    Allocate payment
    Update installment
    Update loan
    Create financial effects
    Create audit record
COMMIT
```

If any critical operation fails:

```text
ROLLBACK
```

This prevents partially applied financial operations.

---

# 18. Payment Processing Architecture

A payment should follow this conceptual flow:

```text
Mobile
  │
  ▼
POST /payments
  │
  ▼
API Layer
  │
  ▼
Payment Service
  │
  ├── Validate loan
  │
  ├── Validate payment
  │
  ├── Load outstanding obligations
  │
  ▼
Payment Allocation Calculator
  │
  ▼
Allocation Result
  │
  ├── Late Fee
  ├── Interest
  └── Principal
  │
  ▼
Persistence Transaction
  │
  ├── Payment
  ├── Installments
  ├── Loan
  ├── Financial Effects
  └── Audit Log
  │
  ▼
API Response
```

The allocation order is defined by the payment business rules and must not be reimplemented differently in another layer.

---

# 19. Loan Creation Architecture

Loan creation follows:

```text
Mobile
  ↓
POST /loans
  ↓
API Validation
  ↓
Loan Service
  ↓
Loan Configuration Validation
  ↓
Financial Calculator
  ↓
Amortization Schedule
  ↓
Database Transaction
  ├── Loan
  └── Installments
  ↓
Response
```

The schedule must be generated by the backend.

The mobile application must never generate the authoritative loan schedule.

---

# 20. Personal Finance Transaction Flow

Creating an income or expense follows:

```text
Mobile
  ↓
POST /transactions
  ↓
API
  ↓
Transaction Service
  ↓
Validation
  ↓
Repository
  ↓
PostgreSQL
  ↓
Response
```

The balance is derived from persisted valid transactions.

The application should not require an independently editable balance field.

---

# 21. Financial Goal Flow

Creating a contribution follows:

```text
Mobile
  ↓
POST /goals/{goal_id}/contributions
  ↓
API
  ↓
Goal Service
  ↓
Validation
  ↓
Repository
  ↓
Goal Contribution
  ↓
Goal Summary
  ↓
Response
```

The current amount should be derived from valid contributions.

---

# 22. Authentication Architecture

PocketPal uses JWT-based authentication.

Conceptual flow:

```text
Login
  ↓
Validate credentials
  ↓
Verify password hash
  ↓
Generate JWT
  ↓
Mobile stores authentication state
  ↓
Authenticated API requests
  ↓
JWT validation
  ↓
Identify user
  ↓
Authorize resource
```

Passwords must never be stored as plaintext.

---

# 23. Authorization

Authentication answers:

```text
Who is the user?
```

Authorization answers:

```text
What can this user access?
```

Every protected financial resource must verify ownership.

Example:

```text
GET /loans/123
```

must verify that:

```text
loan.user_id == authenticated_user.id
```

The API must never rely solely on a client-provided identifier.

---

# 24. API Communication

The mobile application communicates with the backend through HTTPS.

Conceptual request:

```text
Mobile
  ↓
HTTPS
  ↓
FastAPI
```

The mobile API client should centralize:

* base URL;
* authentication headers;
* request handling;
* response parsing;
* error normalization;
* token handling.

---

# 25. Mobile Architecture

The mobile application follows a feature-oriented structure.

```text
mobile/
│
├── app/
├── components/
├── features/
├── services/
├── stores/
├── hooks/
├── types/
└── utils/
```

---

# 26. App Directory

The `app/` directory is responsible primarily for routing and screen composition.

Expo Router is used for navigation.

The application should avoid placing complex business logic directly inside route files.

---

# 27. Components

The `components/` directory contains reusable UI components.

Examples:

```text
Button
Input
Card
Modal
Badge
CurrencyDisplay
StatusBadge
LoadingState
EmptyState
ErrorState
```

Reusable components must remain as presentation-focused as possible.

---

# 28. Features

The `features/` directory organizes functionality by domain.

Example:

```text
features/
├── auth/
├── dashboard/
├── finance/
├── loans/
├── clients/
├── goals/
├── collections/
└── reports/
```

Each feature may contain:

```text
components/
hooks/
queries/
mutations/
types/
utils/
```

---

# 29. Client State Management

Zustand is used for local application state where appropriate.

Examples:

* authentication state;
* UI preferences;
* theme;
* temporary interface state.

TanStack Query is used for server state.

Examples:

* loans;
* installments;
* payments;
* customers;
* transactions;
* dashboard data.

The application should avoid duplicating server state unnecessarily inside Zustand.

---

# 30. Form Architecture

Forms use:

```text
React Hook Form
Zod
```

Responsibilities:

```text
React Hook Form
→ form state

Zod
→ input validation

Backend
→ authoritative business validation
```

Client validation improves user experience but does not replace backend validation.

---

# 31. Error Handling

Errors should be handled consistently across the application.

Backend errors should provide structured responses.

Conceptual format:

```json
{
  "code": "PAYMENT_AMOUNT_INVALID",
  "message": "Payment amount must be greater than zero"
}
```

The mobile application should translate technical errors into understandable user feedback.

---

# 32. Loading and Empty States

The architecture must support explicit UI states:

```text
LOADING
SUCCESS
EMPTY
ERROR
```

Examples:

```text
Loading loans...
No active loans
Unable to load loans
```

These states belong to the presentation layer.

---

# 33. Idempotency

Important financial operations should support idempotent behavior where appropriate.

This is especially important for payment registration.

A network retry must not accidentally create duplicate financial effects.

Conceptual flow:

```text
Request
   ↓
Idempotency Key
   ↓
Check previous operation
   ↓
Already processed?
   ├── Yes → Return existing result
   └── No  → Process operation
```

The exact implementation will be defined in the API and database documentation.

---

# 34. Concurrency Control

Financial operations must consider concurrent requests.

Example:

```text
Customer pays $100,000
```

Two identical requests arriving simultaneously must not result in:

```text
$200,000
```

being applied to the loan.

The backend must use appropriate database transactions and concurrency controls.

---

# 35. Audit Architecture

Important financial operations should generate audit records.

Conceptual structure:

```text
User
  ↓
Action
  ↓
Domain Service
  ↓
Financial Operation
  ↓
Audit Log
```

Examples:

```text
PAYMENT_CREATED
PAYMENT_REVERSED
LOAN_CREATED
LOAN_CANCELLED
TRANSACTION_CANCELLED
```

The detailed audit schema belongs to:

```text
docs/technical/DATABASE.md
```

---

# 36. Integration Between Loan and Finance Domains

Loan management and personal finance management must remain separate domains while supporting controlled integration.

Conceptually:

```text
              PocketPal
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 Personal Finance        Loan Domain
        │                   │
        │                   │
        └─────────┬─────────┘
                  ▼
          Financial Effects
```

The loan domain determines:

```text
principal recovered
interest received
late fee received
```

The personal finance domain consumes the resulting financial effects.

This prevents double counting.

---

# 37. Domain Boundaries

The main domains are:

```text
Authentication
Personal Finance
Financial Goals
Customers
Loans
Payments
Collections
Reports
```

The most financially sensitive domains are:

```text
Loans
Payments
Collections
Personal Finance
```

These domains require stronger testing and transaction guarantees.

---

# 38. Reports Architecture

Reports should be generated from persisted domain data.

The frontend should not independently calculate authoritative reports.

Conceptual flow:

```text
Mobile
  ↓
Report Endpoint
  ↓
Reporting Service
  ↓
Repositories / Queries
  ↓
Aggregated Results
  ↓
Mobile Visualization
```

The reporting layer may use optimized database queries for aggregation.

---

# 39. API Versioning

The API should support versioning.

Initial conceptual prefix:

```text
/api/v1/
```

Example:

```text
/api/v1/auth/login
/api/v1/loans
/api/v1/payments
/api/v1/transactions
```

Breaking API changes should require a new API version.

---

# 40. Configuration

Environment-specific configuration must not be hard-coded.

Examples:

```text
DATABASE_URL
JWT_SECRET
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
API_BASE_URL
```

Secrets must be supplied through environment configuration.

They must never be committed to source control.

---

# 41. Development Environment

The project should support local development using Docker where appropriate.

Conceptual environment:

```text
Docker Compose
│
├── PostgreSQL
├── Backend
└── Supporting services
```

The exact container configuration belongs to the implementation repository.

---

# 42. Production Architecture

The production architecture should maintain the same logical separation.

Conceptually:

```text
                    Internet
                       │
                       ▼
                HTTPS / TLS
                       │
                       ▼
              Backend Application
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        Application          PostgreSQL
          Services              │
             │                  │
             └──────────────────┘
```

The mobile application communicates only with the public API.

The database must not be directly exposed to the mobile client.

---

# 43. Observability

The backend should provide sufficient logging to diagnose application failures.

Important events include:

* authentication failures;
* API errors;
* financial operation failures;
* payment processing;
* database errors;
* unexpected exceptions.

Logs must not expose:

* passwords;
* authentication secrets;
* sensitive tokens;
* unnecessary personal information.

---

# 44. Testing Architecture

Testing must occur at multiple levels.

```text
Unit Tests
    ↓
Financial Calculators

Integration Tests
    ↓
Services + Database

API Tests
    ↓
HTTP Endpoints

End-to-End Tests
    ↓
Mobile + API
```

Financial calculators should have the highest degree of deterministic unit testing.

Detailed testing requirements belong to:

```text
docs/development/TESTING.md
```

---

# 45. Dependency Direction

Dependencies should flow inward toward domain logic.

Preferred:

```text
API
 ↓
Services
 ↓
Calculators / Domain Logic
 ↓
Repositories
 ↓
Database
```

The financial calculator layer should not depend on:

```text
FastAPI
React Native
HTTP
PostgreSQL
```

This keeps financial logic portable and testable.

---

# 46. Anti-Patterns

The following architectural patterns are prohibited.

## 46.1 Financial Calculations in React Native

Do not calculate authoritative:

* interest;
* loan balance;
* late fees;
* payment allocation;
* installment status

inside the mobile application.

---

## 46.2 Financial Calculations Inside Routes

Avoid:

```python
@router.post("/payments")
def create_payment(...):
    # hundreds of lines of financial logic
```

Routes should delegate to services.

---

## 46.3 Direct Database Access from Mobile

The mobile application must never connect directly to PostgreSQL.

---

## 46.4 Duplicated Business Rules

The same financial rule must not be independently implemented in:

```text
frontend
backend service
calculator
database trigger
```

without an explicit reason.

The authoritative implementation must be clearly defined.

---

## 46.5 Mutable Financial History

Financial records must not be silently overwritten or physically deleted when doing so would destroy historical traceability.

---

# 47. Example Complete Payment Request

A complete payment operation should conceptually execute as follows:

```text
1. Mobile submits payment request.

2. API authenticates user.

3. API validates request schema.

4. Payment Service loads loan.

5. Service verifies ownership.

6. Service loads outstanding installments.

7. Payment Allocation Calculator determines allocation.

8. Service starts database transaction.

9. Payment record is created.

10. Installments are updated.

11. Loan balance is updated.

12. Financial effects are recorded.

13. Audit record is created.

14. Transaction commits.

15. Backend returns resulting payment state.

16. Mobile refreshes affected server state.
```

At no point should the mobile application become the authoritative source for the resulting financial state.

---

# 48. Architectural Quality Requirements

The architecture must maintain:

* clear separation of concerns;
* deterministic financial calculations;
* database consistency;
* API validation;
* user-level authorization;
* testability;
* auditability;
* maintainability;
* extensibility.

Technical convenience must not override financial integrity.

---

# 49. Relationship With Other Documentation

This document defines architecture, not detailed database or API contracts.

Responsibilities are separated as follows:

```text
PRODUCT_SPECIFICATION.md
        ↓
What PocketPal does

business/
├── FINANCIAL_RULES.md
├── LOAN_RULES.md
└── PAYMENT_RULES.md
        ↓
How financial behavior works

technical/
├── ARCHITECTURE.md
        ↓
How the system is structured

├── DATABASE.md
        ↓
How data is persisted

├── API.md
        ↓
How systems communicate

└── SECURITY.md
        ↓
How the system is protected

design/
├── UX_UI.md
└── DESIGN_SYSTEM.md
        ↓
How the product is experienced

development/
├── ROADMAP.md
├── TESTING.md
└── AI_DEVELOPMENT_RULES.md
        ↓
How the product is developed
```

---

# 50. Definition of Done

The architecture is considered sufficiently defined when:

* application layers are clearly separated;
* responsibilities are documented;
* financial calculations have an isolated location;
* API and mobile responsibilities are defined;
* persistence boundaries are established;
* transaction boundaries are identified;
* authentication and authorization responsibilities are defined;
* financial operations are designed for traceability;
* concurrency concerns are documented;
* testing boundaries are defined;
* future technical documentation can build upon this architecture.

---

# 51. Versioning

This document represents:

```text
PocketPal System Architecture v1.0
```

Architectural changes that affect financial integrity, persistence, API contracts or domain boundaries must be explicitly documented.

Architecture must evolve through deliberate changes rather than undocumented implementation decisions.
