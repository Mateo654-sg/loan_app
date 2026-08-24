# PocketPal — AI Development Rules

**Version:** 1.0
**Status:** Official Development Rules
**Domain:** AI-assisted software development
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`

---

# 1. Purpose

This document defines the rules that must be followed when using artificial intelligence tools to develop PocketPal.

The objective is to use AI to increase development speed without sacrificing:

* financial correctness;
* security;
* architecture;
* maintainability;
* testability;
* code quality;
* traceability;
* product scope.

AI is an **development assistant**, not the authority over PocketPal's business rules.

The official product and business documentation remains authoritative.

---

# 2. Source of Truth

AI-generated code, explanations, refactors and suggestions must be evaluated against the project's official documentation.

The documentation hierarchy is:

```text
PRODUCT_SPECIFICATION.md
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

AI must not invent business rules when the official documentation already defines them.

If the documentation does not define a required behavior, AI must identify the ambiguity instead of silently inventing a rule.

---

# 3. AI Role

AI may act as:

* coding assistant;
* architecture assistant;
* debugging assistant;
* testing assistant;
* documentation assistant;
* code reviewer;
* refactoring assistant;
* learning assistant;
* research assistant.

AI must not act as the final authority for:

* financial calculations;
* security decisions;
* authentication behavior;
* payment allocation;
* loan state transitions;
* data integrity rules;
* destructive database operations.

The developer remains responsible for accepting and integrating AI-generated work.

---

# 4. General AI Principles

AI-assisted development must follow these principles:

1. Understand before modifying.
2. Read the relevant project documentation first.
3. Prefer small changes over massive generated implementations.
4. Never invent undocumented financial behavior.
5. Never bypass existing architecture without explicit justification.
6. Never introduce unnecessary dependencies.
7. Always validate generated code.
8. Test financial logic independently.
9. Preserve existing functionality.
10. Keep changes traceable.
11. Prefer explicit code over clever code.
12. Avoid premature abstraction.
13. Never expose secrets to AI tools.
14. Never trust generated code without review.

---

# 5. Context Before Code

Before asking AI to implement a feature, provide enough context to understand:

```text
Feature
Domain
Architecture
Relevant business rules
Existing implementation
Expected behavior
Constraints
Tests
```

For example, a loan-payment feature should be developed with knowledge of:

```text
PRODUCT_SPECIFICATION.md
LOAN_RULES.md
PAYMENT_RULES.md
FINANCIAL_RULES.md
DATABASE.md
API.md
TESTING.md
```

AI should not generate a payment engine from a short prompt such as:

```text
"Create loan payment functionality."
```

without the relevant business context.

---

# 6. Business Rules Are Not AI-Generated

AI must never invent financial rules merely to make an implementation possible.

Examples of rules that must come from official documentation:

* interest calculation;
* amortization;
* payment allocation;
* late-fee calculation;
* overdue status;
* installment status;
* principal recovery;
* financial income;
* rounding;
* date calculations.

If a rule is missing, AI should respond with an explicit ambiguity such as:

```text
This behavior is not currently defined in the business rules.
```

The rule must then be formally defined in the appropriate documentation before implementation.

---

# 7. Financial Calculations

Financial calculations receive the highest level of AI scrutiny.

AI-generated financial code must:

* use decimal arithmetic;
* avoid floating-point money calculations;
* use deterministic rounding;
* preserve precision;
* handle boundary conditions;
* prevent negative outstanding principal;
* preserve payment allocation;
* handle partial payments;
* handle date transitions;
* include automated tests.

The frontend must never independently reproduce authoritative financial calculations.

The backend is the financial source of truth.

---

# 8. AI and Money Types

AI must never introduce:

```text
float
double
```

for monetary values.

Preferred representation:

```text
Decimal
```

Example:

```python
from decimal import Decimal
```

Incorrect:

```python
amount: float
```

Correct:

```python
amount: Decimal
```

The same principle applies to:

* principal;
* interest;
* late fees;
* payments;
* balances;
* goal amounts;
* transaction amounts.

---

# 9. AI and Loan Calculators

Loan calculators must be isolated from:

* HTTP handlers;
* database queries;
* React Native components;
* authentication logic;
* UI state.

Conceptually:

```text
API
 │
 ▼
Service
 │
 ▼
Calculator
 │
 ▼
Financial Result
```

The calculator should be deterministic.

Given identical inputs, it should produce identical results.

Example:

```text
principal
interest_rate
interest_period
payment_frequency
number_of_installments
start_date
```

must produce the same schedule when all relevant inputs are identical.

---

# 10. AI and Payment Logic

Payment logic is financially sensitive.

AI-generated payment code must explicitly account for:

```text
Late Fee
    ↓
Interest
    ↓
Principal
```

according to the official payment rules.

The AI must not change the allocation order because another implementation appears simpler.

Payment allocation must be:

* deterministic;
* traceable;
* testable;
* resistant to duplicate execution;
* compatible with partial payments.

---

# 11. AI and Database Changes

AI-generated database modifications require special review.

Before accepting a migration, verify:

* data preservation;
* foreign keys;
* indexes;
* constraints;
* nullable fields;
* decimal precision;
* uniqueness;
* user isolation;
* cascade behavior;
* migration reversibility where applicable.

AI must never execute destructive operations automatically.

Examples requiring explicit review:

```text
DROP TABLE
DROP COLUMN
TRUNCATE
DELETE
ALTER TYPE
```

A destructive migration must have a documented reason and migration strategy.

---

# 12. AI and User Data Isolation

Every user-owned entity must enforce ownership.

AI-generated endpoints must never rely only on:

```text
/client/{client_id}
```

without verifying that the client belongs to the authenticated user.

Conceptually:

```text
Authenticated User
        │
        ▼
Resource Ownership
        │
        ▼
Authorized Operation
```

A valid identifier is not sufficient authorization.

---

# 13. AI and Authentication

AI-generated authentication code must follow the project's security documentation.

AI must never:

* store plaintext passwords;
* hard-code JWT secrets;
* hard-code credentials;
* bypass authorization;
* expose tokens in logs;
* place secrets in frontend source code;
* disable authentication for convenience.

Development shortcuts must not silently become production behavior.

---

# 14. Secrets

Secrets must never be included in prompts sent to external AI services.

Examples:

```text
DATABASE_PASSWORD
JWT_SECRET
API_KEY
AWS_SECRET_ACCESS_KEY
PRIVATE_KEY
ACCESS_TOKEN
REFRESH_TOKEN
```

If AI needs configuration context, use placeholders:

```text
DATABASE_PASSWORD=<REDACTED>
JWT_SECRET=<REDACTED>
```

Never paste real production credentials into AI conversations.

---

# 15. AI-Generated Dependencies

AI should not introduce a package merely because it is convenient.

Before adding a dependency, evaluate:

1. Is it necessary?
2. Does the project already provide equivalent functionality?
3. Is it compatible with the current stack?
4. Is it actively maintained?
5. Does it increase security risk?
6. Does it increase bundle size?
7. Does it introduce architectural coupling?
8. Is the license acceptable?

PocketPal should prefer existing dependencies when they are sufficient.

---

# 16. Technology Constraints

AI-generated code must respect the established stack.

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

AI must not replace the stack without an explicit architectural decision.

For example, AI should not spontaneously introduce:

```text
Redux
Django
MongoDB
Firebase
Flutter
NestJS
Prisma
```

unless the project architecture explicitly changes.

---

# 17. TypeScript Rules

AI-generated TypeScript must prioritize type safety.

Avoid:

```typescript
any
```

unless there is a documented technical reason.

Prefer:

```typescript
unknown
```

with explicit validation when the type cannot be known safely.

API responses should have defined types.

Forms should use schema validation.

Financial values received from the API must be handled consistently with the backend monetary representation.

---

# 18. Python Rules

AI-generated Python should follow:

* clear type annotations;
* small functions;
* explicit dependencies;
* predictable exceptions;
* separation of business logic;
* testability;
* project conventions.

Avoid unnecessarily complex abstractions.

Prefer:

```text
simple
explicit
testable
```

over:

```text
clever
implicit
highly abstract
```

---

# 19. Backend Architecture

AI must respect the separation between:

```text
API
Services
Repositories
Models
Schemas
Calculators
Database
```

A FastAPI endpoint should not contain a complete financial algorithm.

Incorrect conceptual structure:

```text
Endpoint
 ├── database queries
 ├── payment allocation
 ├── interest calculation
 ├── late fee calculation
 └── response
```

Preferred:

```text
Endpoint
    ↓
Service
    ↓
Calculator
    ↓
Repository
```

The exact architecture must follow `docs/technical/ARCHITECTURE.md`.

---

# 20. Frontend Architecture

AI-generated React Native code must respect feature boundaries.

Preferred conceptual structure:

```text
features/
    finance/
    loans/
    clients/
    goals/
    dashboard/
```

Components should not contain business calculations that belong to the backend.

For example, a UI component should not independently calculate:

```text
loan interest
late fees
outstanding principal
payment allocation
```

It should display authoritative values returned by the API.

---

# 21. AI and API Contracts

AI must not arbitrarily change API contracts.

Before modifying an endpoint, verify:

* request schema;
* response schema;
* HTTP method;
* authentication;
* error responses;
* pagination;
* filtering;
* frontend consumers;
* tests;
* documentation.

Breaking API changes must be intentional.

---

# 22. Error Handling

AI-generated code must distinguish between:

```text
Validation Error
Authentication Error
Authorization Error
Not Found
Business Rule Violation
Conflict
Internal Error
```

Financial business-rule violations should not be disguised as generic server errors.

The frontend should receive predictable error structures.

---

# 23. Validation

Validation should occur at appropriate layers.

```text
Frontend
    ↓
User experience validation

Backend Schema
    ↓
Input validation

Business Service
    ↓
Business rule validation

Database
    ↓
Integrity constraints
```

Client-side validation must never replace backend validation.

---

# 24. AI and Testing

AI-generated features are not considered complete without appropriate tests.

At minimum, AI should be asked to generate tests for:

* normal behavior;
* boundary conditions;
* invalid inputs;
* empty states;
* partial operations;
* duplicate operations;
* authorization;
* relevant errors.

Financial code requires especially strong test coverage.

---

# 25. Test Before Refactor

When modifying existing financial logic:

```text
Existing tests
      ↓
Understand behavior
      ↓
Modify code
      ↓
Run tests
      ↓
Add missing tests
      ↓
Refactor if necessary
```

AI must not perform large refactors before the existing behavior is understood.

---

# 26. Edge Cases

AI prompts for financial features should explicitly request edge-case analysis.

Examples:

```text
0 installments
1 installment
very small principal
very large principal
rounding remainder
February
February 29
month end
year end
partial payment
overpayment
duplicate payment
payment after overdue
multiple overdue installments
zero interest
high interest
late fee disabled
grace period
```

The exact expected behavior must come from business rules.

AI should identify unhandled cases instead of silently deciding their behavior.

---

# 27. Date Logic

Date calculations must be treated as high-risk logic.

AI-generated code must be tested for:

* month transitions;
* February;
* leap years;
* year transitions;
* different payment frequencies;
* first due date;
* overdue calculations;
* timezone boundaries.

The application must use a consistent timezone strategy.

---

# 28. Idempotency

Financial operations that may be retried must be designed to avoid duplicate effects.

Examples:

```text
Register payment
Create financial transaction
Apply payment allocation
Reverse payment
```

If an operation is retried, the system should not accidentally:

```text
apply payment twice
create duplicate financial income
reduce principal twice
```

AI-generated implementations must explicitly consider retry behavior.

---

# 29. Concurrency

AI-generated financial operations must consider concurrent requests.

Example:

```text
Request A → register $100,000 payment
Request B → register $100,000 payment
```

The system must not produce inconsistent balances because both requests read the same previous state.

The exact transaction and locking strategy belongs to the technical architecture and database documentation.

---

# 30. Logging

AI-generated code should log useful technical information without exposing sensitive data.

Never log:

* passwords;
* access tokens;
* refresh tokens;
* secret keys;
* complete authentication credentials.

Financial logs should avoid unnecessarily exposing personal information.

---

# 31. AI and Personal Data

AI tools should receive the minimum data necessary.

When debugging customer-related functionality, prefer synthetic data:

```text
Client A
5550001
client@example.test
```

instead of real customer information.

Real financial records should not be pasted into AI prompts unless explicitly authorized and appropriately protected.

---

# 32. Prompt Engineering Rules

AI prompts should be specific.

A good implementation prompt should contain:

```text
Context
Goal
Relevant files
Constraints
Expected behavior
Acceptance criteria
Testing requirements
```

Example structure:

```text
Context:
PocketPal is a React Native + FastAPI financial application.

Task:
Implement the payment allocation service.

Business rules:
Use the allocation order defined in PAYMENT_RULES.md.

Constraints:
Use Decimal.
Do not modify API contracts.
Do not introduce dependencies.

Acceptance criteria:
- Full payment works.
- Partial payment works.
- Allocation is deterministic.
- Existing principal never becomes negative.

Tests:
Add unit tests for full, partial and overdue payments.
```

---

# 33. Small Prompt → Small Change

AI should generally be asked to perform focused changes.

Prefer:

```text
Implement the loan installment calculator.
```

over:

```text
Build the entire loan system.
```

Prefer:

```text
Add tests for payment allocation.
```

over:

```text
Fix and improve the whole backend.
```

Small changes improve:

* reviewability;
* debugging;
* testability;
* rollback;
* understanding.

---

# 34. AI-Generated Code Review

Every generated code change must be reviewed before acceptance.

Review:

```text
Correctness
Architecture
Security
Performance
Readability
Tests
Error handling
Data integrity
Documentation
```

For financial code, additionally review:

```text
Decimal arithmetic
Rounding
Allocation
State transitions
Dates
Duplicate operations
Concurrency
Historical integrity
```

---

# 35. Never Blindly Accept AI Output

AI can produce code that:

* compiles but is logically wrong;
* passes superficial tests;
* uses incorrect financial formulas;
* leaks data;
* introduces security vulnerabilities;
* violates architecture;
* creates race conditions;
* silently changes behavior.

Therefore:

```text
AI output ≠ verified implementation
```

AI-generated code must be treated as a proposed implementation.

---

# 36. AI and Refactoring

AI may refactor code when:

* existing behavior is understood;
* tests exist;
* the refactor has a clear objective;
* the public contract is preserved.

AI must not perform broad refactors merely to make code "cleaner."

Refactoring should improve:

* maintainability;
* readability;
* testability;
* separation of responsibilities.

It should not unnecessarily change business behavior.

---

# 37. AI and Documentation

AI may generate documentation based on the actual implementation.

However, documentation must not describe functionality that does not exist.

Before generating documentation, AI should distinguish:

```text
Implemented
Planned
Proposed
Deprecated
```

Do not document planned functionality as implemented functionality.

---

# 38. AI and Git

AI-generated changes should be committed in logical units.

Preferred:

```text
feat: add loan calculator
test: add loan calculator tests
feat: add payment allocation
test: add payment allocation tests
docs: define payment behavior
```

Avoid large commits such as:

```text
feat: build entire application
```

Small commits make AI-assisted development easier to review and revert.

---

# 39. Commit Integrity

A commit should represent a coherent change.

Avoid mixing:

```text
financial rule changes
+
database migration
+
UI redesign
+
unrelated refactor
```

unless they are genuinely required by the same feature.

---

# 40. AI and Pull Requests

AI-generated pull requests should contain:

* objective;
* implemented changes;
* affected modules;
* business rules involved;
* tests;
* known limitations;
* migration requirements;
* potential risks.

Financial changes should explicitly state which business rules were affected.

---

# 41. Definition of Done for AI-Assisted Work

AI-assisted development is considered complete only when:

* the implementation matches official requirements;
* business rules are respected;
* architecture is respected;
* input validation exists;
* error handling exists;
* appropriate tests pass;
* financial calculations are verified;
* no secrets are exposed;
* no unnecessary dependencies were introduced;
* documentation is updated where required;
* existing functionality remains functional.

---

# 42. AI Must Ask for Clarification When Necessary

AI should stop and request clarification when:

* two official documents conflict;
* a financial rule is undefined;
* an API contract is ambiguous;
* a database migration could cause data loss;
* expected behavior is unclear;
* a feature conflicts with product scope.

The preferred behavior is:

```text
Identify ambiguity
        ↓
Explain impact
        ↓
Ask for decision
        ↓
Document decision
        ↓
Implement
```

AI must not silently choose a financially significant interpretation.

---

# 43. Handling Documentation Conflicts

If AI discovers:

```text
PRODUCT_SPECIFICATION.md
```

says one thing while:

```text
LOAN_RULES.md
```

says another, it must not silently resolve the conflict.

The conflict should be reported.

Example:

```text
Conflict detected:

PRODUCT_SPECIFICATION.md:
Payment allocation = Late Fee → Interest → Principal

PAYMENT_RULES.md:
Payment allocation = Interest → Late Fee → Principal

Implementation should not continue until the authoritative rule is confirmed.
```

After the decision, the documentation should be updated.

---

# 44. AI and Scope Control

AI must not expand PocketPal's scope without explicit approval.

Examples of features that should not be introduced automatically:

```text
Bank integrations
Digital wallet
Payment gateway
Credit bureau
External credit scoring
Marketplace
Business accounting
Multi-company accounting
```

Technical possibility does not imply product requirement.

---

# 45. AI and Product Decisions

AI may recommend alternatives, but product decisions must remain explicit.

For significant decisions, record:

```text
Decision
Reason
Alternatives considered
Impact
Date
```

Important decisions should be reflected in the appropriate documentation.

---

# 46. Research With AI

When AI is used to research libraries, frameworks, APIs or external technical information:

1. Verify current documentation.
2. Prefer official documentation.
3. Check compatibility with the current stack.
4. Verify versions.
5. Avoid relying solely on AI memory.
6. Record important external dependencies.

AI must clearly distinguish between:

```text
Known project rule
External documented fact
AI recommendation
Assumption
```

---

# 47. Code Generation Priority

When generating code, AI should prioritize:

```text
Correctness
    ↓
Security
    ↓
Financial integrity
    ↓
Testability
    ↓
Maintainability
    ↓
Performance
    ↓
Convenience
```

Performance optimizations must not compromise correctness.

---

# 48. Simplicity Over Cleverness

AI should prefer straightforward implementations.

Prefer:

```text
explicit business service
```

over:

```text
complex generic abstraction
```

when both solve the same problem.

PocketPal is a financial application.

Readable and auditable code is more valuable than clever code.

---

# 49. Financial Code Requires Human Verification

The developer must personally verify critical financial algorithms.

At minimum:

* interest;
* amortization;
* payment allocation;
* late fees;
* installment status;
* outstanding principal;
* financial integration.

AI may generate the implementation and tests, but the final financial behavior must be independently verified.

---

# 50. AI Development Workflow

The recommended workflow is:

```text
1. Read documentation
        ↓
2. Identify requirements
        ↓
3. Identify business rules
        ↓
4. Identify affected architecture
        ↓
5. Define acceptance criteria
        ↓
6. Ask AI for a small implementation
        ↓
7. Review generated code
        ↓
8. Run tests
        ↓
9. Add missing tests
        ↓
10. Review financial/security implications
        ↓
11. Update documentation
        ↓
12. Commit the change
```

---

# 51. Feature Development Template

Every AI-assisted feature should conceptually follow:

```text
Feature:
<name>

Purpose:
<problem solved>

Relevant specification:
<documents>

Business rules:
<rules>

Affected modules:
<modules>

Constraints:
<constraints>

Acceptance criteria:
<criteria>

Tests:
<tests>

Risks:
<risks>
```

This structure should be used for complex features.

---

# 52. AI Debugging Workflow

When debugging, AI should follow:

```text
Reproduce
   ↓
Observe
   ↓
Identify error
   ↓
Determine root cause
   ↓
Propose minimal fix
   ↓
Implement
   ↓
Test
   ↓
Verify regression
```

AI should not immediately rewrite an entire module because of a single error.

---

# 53. AI and Error Messages

When debugging an error, provide AI with:

* complete error message;
* relevant stack trace;
* affected code;
* expected behavior;
* actual behavior;
* environment/version;
* recent changes.

Avoid vague prompts such as:

```text
"it doesn't work, fix it."
```

---

# 54. AI and Performance Optimization

Performance optimization should occur after correctness.

AI should not introduce:

* unnecessary caching;
* premature microservices;
* complicated state management;
* database denormalization;
* background workers;

without evidence that they are necessary.

The optimization should address a measured problem.

---

# 55. AI and Security Review

Security-sensitive AI-generated code must be reviewed independently.

High-risk areas include:

```text
Authentication
Authorization
JWT
Passwords
Database access
File uploads
User isolation
API validation
Secrets
Logging
Payments
```

A feature must not be considered secure merely because AI claims it is secure.

---

# 56. AI and Testing Strategy

AI should help produce tests at multiple levels.

## Unit

For:

```text
Calculators
Services
Validators
Utilities
```

## Integration

For:

```text
API
Database
Authentication
Financial operations
```

## End-to-End

For:

```text
Critical user workflows
```

Financial calculators should have strong unit-test coverage before integration.

---

# 57. Regression Protection

Whenever AI modifies existing behavior:

```text
Existing tests
+
New tests
```

must be considered.

A change that fixes one scenario but breaks another is not complete.

Critical business rules should have regression tests.

---

# 58. Generated Tests Must Be Reviewed

AI can generate incorrect tests.

A test is not valuable merely because it passes.

Review whether the test verifies the actual business rule.

Bad test:

```text
assert result is not None
```

Better financial test:

```text
assert principal_paid == expected_principal
assert interest_paid == expected_interest
assert remaining_balance == expected_balance
```

Expected values should come from independently verified examples.

---

# 59. AI and Test Data

Use deterministic synthetic test data.

Example:

```text
Principal: 1,000,000 COP
Interest: 10%
Installments: 10
```

Test data should make expected results easy to verify manually.

Avoid relying exclusively on random values for critical financial tests.

---

# 60. AI Development Anti-Patterns

The following practices are prohibited or strongly discouraged:

```text
Copying generated code without review
Inventing business rules
Ignoring tests
Using float for money
Hard-coding secrets
Bypassing authentication
Mixing business logic into UI
Massive unreviewed refactors
Adding unnecessary dependencies
Changing API contracts silently
Destructive migrations without review
Deleting financial history
Trusting AI-generated formulas blindly
```

---

# 61. AI as Pair Programmer

The preferred relationship is:

```text
Developer ↔ AI
```

rather than:

```text
Developer → AI → entire application
```

The developer should remain actively involved in:

* architecture;
* business rules;
* code review;
* testing;
* debugging;
* product decisions.

AI accelerates implementation but does not replace engineering judgment.

---

# 62. AI Output Quality Standard

Generated code should be:

```text
Readable
Typed
Testable
Secure
Deterministic
Minimal
Documented where necessary
Consistent with project conventions
```

If generated code does not meet these standards, it should be revised before integration.

---

# 63. Final AI Development Rule

The fundamental rule for PocketPal is:

> **AI may accelerate implementation, but it must never override financial truth, security requirements, architectural decisions or officially defined business rules.**

The final authority remains:

```text
Official Documentation
        ↓
Business Rules
        ↓
Architecture
        ↓
Tests
        ↓
Human Review
        ↓
Implementation
```

AI-generated code is accepted only when it passes this chain of verification.

---

# 64. Versioning

This document represents:

```text
PocketPal AI Development Rules v1.0
```

Any change to these rules should be documented explicitly.

AI development practices must evolve together with:

* the product;
* architecture;
* security requirements;
* development workflow;
* testing strategy.

Changes must never weaken financial integrity or security merely to increase development speed.
