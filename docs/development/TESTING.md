# PocketPal — Testing Strategy

**Version:** 1.0
**Status:** Official Development Document
**Domain:** Testing & Quality Assurance
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`

---

# 1. Purpose

This document defines the testing strategy for PocketPal.

Its purpose is to ensure that:

* financial calculations are correct;
* business rules are deterministic;
* APIs behave consistently;
* data integrity is preserved;
* authentication and user isolation work correctly;
* the mobile application behaves according to the product specification;
* changes do not introduce regressions.

Testing is especially important because PocketPal handles financial information where an incorrect calculation can produce incorrect balances, payment allocations, interest or collection amounts.

The product specification explicitly requires automated tests for the financial engine before considering the application production-ready.

---

# 2. Testing Principles

PocketPal testing follows these principles:

1. Financial calculations must be tested independently from the UI.
2. Business rules must have automated tests.
3. Tests must be deterministic.
4. Financial calculations must use exact decimal arithmetic.
5. Backend calculations are authoritative.
6. API tests must validate both successful and invalid operations.
7. Database tests must verify data integrity.
8. Authentication tests must verify user-level isolation.
9. Critical financial operations must be protected against duplicate execution.
10. Regression tests must be added when a production defect is discovered.
11. A feature is not considered complete without the tests required by its risk level.
12. Tests must reflect the business rules documented in `docs/business/`.

---

# 3. Testing Pyramid

PocketPal should follow a testing pyramid:

```text
                 ┌───────────────────┐
                 │   E2E Tests       │
                 │   Few / Critical  │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │ Integration Tests │
                 │ API / DB / Auth   │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │   Unit Tests      │
                 │ Business / Math   │
                 └───────────────────┘
```

The largest number of tests should be unit tests.

Integration tests should verify that independently tested components work correctly together.

End-to-end tests should focus on critical user journeys rather than attempting to reproduce every possible scenario.

---

# 4. Testing Levels

PocketPal uses the following testing levels:

```text
Unit
Integration
API
Database
Security
End-to-End
Regression
Performance
```

---

# 5. Unit Testing

Unit tests validate isolated pieces of application logic.

The primary focus is:

```text
backend/app/calculators/
backend/app/services/
```

Examples:

* interest calculations;
* amortization calculations;
* installment calculations;
* late-fee calculations;
* payment allocation;
* balance calculations;
* date calculations;
* financial goal calculations.

Unit tests should avoid unnecessary external dependencies.

---

# 6. Financial Engine Testing

The financial engine is the highest-priority testing area in PocketPal.

Financial calculations must be tested independently from:

* FastAPI routes;
* React Native;
* database persistence;
* UI components.

Conceptually:

```text
Input
  ↓
Financial Calculator
  ↓
Deterministic Result
```

For example:

```text
principal
interest_rate
frequency
number_of_installments
        ↓
Loan Calculator
        ↓
Installment Schedule
```

---

# 7. Fixed Principal Tests

The fixed-principal amortization method must have automated tests.

Minimum scenarios:

### One installment

Verify:

* principal;
* interest;
* total payment;
* remaining balance.

### Two installments

Verify:

* principal distribution;
* interest calculation;
* remaining balance after each installment.

### Ten installments

Verify:

* total principal equals original principal;
* installment count is correct;
* final balance reaches zero within defined rounding rules.

### Rounding

Verify that rounding differences are handled deterministically.

The final installment must account for any accumulated rounding difference.

---

# 8. French Amortization Tests

French amortization must have automated tests.

Minimum scenarios:

* one installment;
* three installments;
* twelve installments;
* different principal amounts;
* different interest rates;
* different payment frequencies;
* rounding behavior.

Each generated installment should contain:

```text
total_payment
principal
interest
remaining_balance
```

The sum of principal components must reconcile with the original principal according to the defined rounding rules.

---

# 9. Interest Tests

Interest calculation tests must verify:

* valid interest rates;
* zero interest;
* different interest periods;
* different payment frequencies;
* outstanding principal;
* rounding;
* boundary values.

The tests must use decimal arithmetic.

Example conceptual case:

```text
Principal = 1,000,000
Rate = 10%
Period = Monthly
```

The expected result must be explicitly defined by the corresponding loan business rules.

---

# 10. Date Calculation Tests

The date engine must be tested independently.

Minimum scenarios:

```text
Month transition
February
Leap year
Year transition
```

Examples:

```text
January → February
February → March
February 28
February 29
December → January
```

The tests must verify that installment due dates are generated according to the configured payment frequency.

---

# 11. Payment Frequency Tests

The supported frequencies are:

```text
ONCE
DAILY
WEEKLY
BIWEEKLY
MONTHLY
CUSTOM
```

Each frequency must have tests for:

* normal dates;
* month transitions;
* year transitions;
* edge cases;
* invalid configurations.

---

# 12. Late Fee Tests

Late-fee calculations must be tested independently.

Minimum scenarios:

### Disabled

```text
enabled = false
```

Expected:

```text
late_fee = 0
```

### Fixed amount

Verify that the configured fixed value is applied correctly.

### Percentage

Verify the percentage against the defined financial base.

### Daily percentage

Verify the calculation according to the number of applicable overdue days.

### Grace period

Verify that late fees are not applied during the configured grace period.

Late fees must remain separate from ordinary interest.

---

# 13. Payment Allocation Tests

Payment allocation is a critical financial operation.

The recommended initial allocation order is:

```text
1. Late fee
2. Interest
3. Principal
```

Tests must verify this order.

Example:

```text
Principal = 100,000
Interest  = 20,000
Late fee  = 5,000

Payment = 80,000
```

The test must verify that the payment is allocated according to the official payment rules.

The expected allocation must come from:

```text
docs/business/PAYMENT_RULES.md
```

The testing document must not independently redefine the business rule.

---

# 14. Partial Payment Tests

Minimum scenarios:

* payment smaller than the installment;
* payment exactly equal to the installment;
* payment greater than one installment;
* payment covering multiple installments;
* payment covering part of multiple obligations;
* payment against overdue obligations.

After each payment, tests must verify:

```text
principal_paid
interest_paid
late_fee_paid
remaining_balance
installment_status
loan_status
```

---

# 15. Full Payment Tests

A full payment must result in the correct final state.

When all required obligations are settled:

```text
Installment → PAID
Loan → PAID
```

The exact transition rules must follow the loan and payment business rules.

The system must never leave a paid loan with an outstanding principal due to rounding or allocation errors.

---

# 16. Overpayment Tests

The system must explicitly define and test what happens when:

```text
payment > outstanding obligation
```

Tests must verify the behavior defined by:

```text
docs/business/PAYMENT_RULES.md
```

The system must never silently create an invalid negative balance.

For example:

```text
Outstanding principal = 100,000
Payment = 120,000
```

must not produce:

```text
Outstanding principal = -20,000
```

---

# 17. Personal Finance Tests

The personal finance module must have automated tests for:

* income creation;
* expense creation;
* balance calculation;
* category validation;
* transaction dates;
* cancelled transactions;
* future-dated transactions;
* zero-value rejection;
* negative amount rejection.

The basic balance rule is:

```text
Balance = Total Income - Total Expenses
```

---

# 18. Transaction Tests

Transaction amounts must be positive.

Valid:

```text
INCOME  = 500,000
EXPENSE = 200,000
```

Invalid:

```text
INCOME  = -500,000
EXPENSE = -200,000
```

Zero-value transactions should also be rejected.

Tests must verify that transaction type determines the financial direction.

---

# 19. Category Tests

Tests must verify:

* category creation;
* category type;
* category ownership;
* category activation;
* category deactivation;
* prevention of invalid category/type combinations.

Example:

```text
EXPENSE transaction
+
INCOME category
```

should normally be rejected.

Historical transactions must remain associated with deactivated categories.

---

# 20. Financial Goal Tests

Financial goals must have tests for:

* goal creation;
* contribution creation;
* contribution cancellation;
* progress calculation;
* completion;
* cancellation;
* target amount validation.

Progress is calculated as:

```text
(current_amount / target_amount) * 100
```

The displayed progress may be capped at:

```text
100%
```

while the actual accumulated amount remains accurate.

---

# 21. Goal Contribution Tests

Each contribution must remain historically traceable.

Tests must verify that:

```text
Current Amount =
SUM(valid contributions)
```

A contribution that is reversed or cancelled must not incorrectly remain part of the active total.

Physical deletion should not be required for normal reversal scenarios.

---

# 22. Loan Integration Tests

The loan system and personal finance system must be tested together.

A customer payment may contain:

```text
Principal recovered
Interest received
Late fee received
```

The test must verify that these components are not incorrectly combined.

For example:

```text
Payment = 120,000

Principal = 100,000
Interest = 20,000
Late fee = 0
```

Expected financial income:

```text
20,000
```

not:

```text
120,000
```

This prevents double counting.

---

# 23. Lending Tests

Creating a loan must not classify the lent principal as a normal personal expense.

Example:

```text
Available funds = 3,000,000
Loan principal  = 1,000,000
```

The test must distinguish:

```text
Loan principal = outstanding receivable
```

from:

```text
Personal expense = 0
```

unless another explicit financial movement occurs.

---

# 24. Avoiding Double Counting

Tests must identify duplicate accounting scenarios.

A payment must not produce:

```text
Total payment as income
+
Interest as income
```

when principal recovery is included in the total payment.

Tests must verify that only the appropriate financial components affect personal income.

---

# 25. API Testing

FastAPI endpoints must have automated integration/API tests.

Tests should cover:

* valid requests;
* invalid requests;
* authentication;
* authorization;
* validation;
* not-found responses;
* conflict responses;
* database persistence;
* financial operations;
* idempotency where applicable.

---

# 26. API Authentication Tests

Protected endpoints must reject unauthenticated requests.

Minimum scenarios:

```text
No token
Invalid token
Expired token
Valid token
```

Expected behavior must be consistent across protected endpoints.

---

# 27. User Isolation Tests

Every authenticated user must only access their own data.

Example:

```text
User A
  └── Loan A

User B
  └── Loan B
```

User A must not be able to:

* retrieve Loan B;
* modify Loan B;
* register a payment against Loan B;
* retrieve User B's customers;
* access User B's transactions.

These tests are mandatory because financial data isolation is a core security requirement.

---

# 28. Database Integration Tests

Database tests must use PostgreSQL or an environment that behaves sufficiently like the production database.

The tests must verify:

* foreign keys;
* unique constraints;
* required fields;
* decimal precision;
* transaction behavior;
* cascade/restrict behavior;
* indexes where relevant;
* persistence;
* rollback behavior.

The application should not rely exclusively on an in-memory database if production behavior depends on PostgreSQL-specific features.

---

# 29. Transaction Atomicity

Financial operations that modify multiple records must be atomic.

For example, registering a payment may require updating:

```text
Payment
Installment
Loan
Financial records
Audit log
```

If one required operation fails, the transaction should not leave partially updated financial state.

Conceptually:

```text
BEGIN
   create payment
   allocate payment
   update installment
   update loan
   create financial records
   create audit record
COMMIT
```

If a critical operation fails:

```text
ROLLBACK
```

Tests must verify this behavior.

---

# 30. Idempotency Tests

Important financial operations should be safe against accidental repeated execution where applicable.

Example:

```text
Client sends payment request
        ↓
Network timeout
        ↓
Client retries
```

The system must not accidentally register the same payment twice when the operation is designed to be idempotent.

Tests must verify the selected idempotency strategy.

---

# 31. Concurrency Tests

Financial operations may be requested concurrently.

Example:

```text
Request A → register payment
Request B → register same payment
```

Tests should verify that concurrent operations cannot produce:

* duplicated payments;
* negative balances;
* duplicated interest;
* inconsistent installment states;
* inconsistent loan states.

Database transactions and appropriate locking/constraints must be used where necessary.

---

# 32. Audit Tests

Audited operations should generate appropriate audit records.

Minimum scenarios:

* loan creation;
* payment registration;
* payment reversal;
* financial transaction modification;
* financial transaction cancellation;
* important loan configuration changes.

Tests must verify that the audit record identifies the relevant:

```text
user
action
entity
entity_id
timestamp
metadata
```

---

# 33. Validation Tests

Validation must exist at multiple layers.

```text
Mobile UI
    ↓
API Schema
    ↓
Business Rules
    ↓
Database Constraints
```

Client-side validation improves user experience.

Backend validation is authoritative.

Database constraints protect persistence integrity.

---

# 34. Error Handling Tests

The API must return consistent errors for invalid operations.

Tests should cover:

* invalid input;
* missing required fields;
* invalid dates;
* invalid monetary values;
* nonexistent resources;
* unauthorized access;
* conflicting operations;
* invalid state transitions.

Error responses should not expose sensitive internal information.

---

# 35. State Transition Tests

Domain entities with statuses must have explicit transition tests.

Examples:

```text
Installment:
PENDING → PARTIAL
PENDING → PAID
PENDING → OVERDUE
OVERDUE → PARTIAL
OVERDUE → PAID
```

Invalid transitions must be rejected.

The exact valid transitions must follow the corresponding business rules.

---

# 36. Loan Status Tests

Loan statuses include:

```text
ACTIVE
PAID
OVERDUE
CANCELLED
```

Tests must verify:

* activation;
* overdue determination;
* payment completion;
* cancellation;
* invalid transitions.

A loan should not be marked `PAID` while required obligations remain outstanding.

---

# 37. Collection Tests

The collections system must be tested for:

```text
TODAY
THIS_WEEK
THIS_MONTH
OVERDUE
UPCOMING
ALL
```

Tests must verify:

* correct customer;
* correct loan;
* correct installment;
* due date;
* expected amount;
* paid amount;
* outstanding amount;
* overdue days;
* late fee;
* status.

The `today` calculation must use the user's configured timezone.

---

# 38. End-to-End Testing

End-to-end tests should cover the most important complete user journeys.

Initial critical journeys:

### Journey 1 — Register

```text
Register
→ Login
→ Access Dashboard
```

### Journey 2 — Personal Finance

```text
Create income
→ Create expense
→ View balance
```

### Journey 3 — Customer

```text
Create customer
→ View customer
→ Add reference
```

### Journey 4 — Loan

```text
Create customer
→ Create loan
→ Generate schedule
→ View installments
```

### Journey 5 — Payment

```text
Open loan
→ Register payment
→ Verify allocation
→ Verify installment
→ Verify loan balance
```

### Journey 6 — Collection

```text
Open collections
→ Filter overdue
→ Open installment
→ Register payment
→ Verify updated status
```

---

# 39. Mobile UI Testing

The React Native application should have tests for critical UI behavior.

Areas include:

* navigation;
* forms;
* validation messages;
* loading states;
* empty states;
* error states;
* success feedback;
* dark mode;
* accessibility;
* critical payment workflows.

UI tests should not duplicate financial calculation tests.

The mobile application consumes financial results from the backend.

---

# 40. Loading and Empty States

Tests should verify that screens behave correctly when:

```text
Loading
No data
Data available
API error
Network failure
```

Examples:

* no customers;
* no loans;
* no collections today;
* no transactions;
* no financial goals.

---

# 41. Regression Testing

Every confirmed defect should result in a regression test when practical.

Example:

```text
Bug:
February installment date calculated incorrectly.

Fix:
Correct date engine.

Regression test:
February date generation.
```

The goal is to prevent the same defect from returning in future releases.

---

# 42. Boundary Testing

Financial systems must be tested with boundary values.

Examples:

```text
0
0.01
1
999,999
1,000,000
Very large amount
Very small interest rate
Very high interest rate
1 installment
Large number of installments
```

The system must reject values outside defined business constraints.

---

# 43. Property-Based Testing

Property-based testing may be used for complex financial calculations.

Useful properties include:

### Principal reconciliation

```text
Sum(principal components)
≈
Original principal
```

according to defined rounding rules.

### Final balance

For a fully amortized loan:

```text
Final balance = 0
```

within the accepted precision.

### Payment allocation

```text
Allocated amount <= Payment amount
```

unless the business rules explicitly define another behavior.

### No negative balances

```text
Outstanding principal >= 0
```

---

# 44. Test Data

Test data must be deterministic and reproducible.

Tests should use controlled values rather than random production-like data unless randomness is specifically required.

Example fixture:

```text
Principal:
1,000,000 COP

Interest:
10%

Installments:
10

Frequency:
MONTHLY
```

Expected results must be explicitly defined.

---

# 45. Test Fixtures

Shared fixtures may be created for:

```text
User
Client
Loan
Installment
Payment
Category
Transaction
Financial Goal
Goal Contribution
```

Fixtures must remain small and focused.

Tests should create only the data required for their scenario.

---

# 46. Test Isolation

Each test should be independent.

A test must not depend on:

* another test executing first;
* production data;
* manually created database records;
* previous test state.

Database changes should be rolled back or isolated appropriately after each test.

---

# 47. Naming Convention

Tests should clearly communicate the behavior being verified.

Recommended format:

```text
test_<action>_<condition>_<expected_result>
```

Examples:

```text
test_calculate_fixed_principal_returns_correct_schedule()

test_partial_payment_updates_installment_status()

test_user_cannot_access_another_users_loan()

test_overdue_installment_applies_late_fee_after_grace_period()
```

---

# 48. Backend Test Structure

The backend may organize tests as:

```text
backend/
└── tests/
    ├── unit/
    │   ├── calculators/
    │   ├── services/
    │   └── utils/
    │
    ├── integration/
    │   ├── api/
    │   ├── database/
    │   └── auth/
    │
    └── e2e/
```

The exact implementation may evolve with the project architecture.

---

# 49. Test Execution

The development workflow should allow developers to execute:

```text
Unit tests
Integration tests
API tests
Full test suite
```

Tests should be executable locally and in CI.

A developer should not need to manually reproduce critical financial scenarios to verify correctness.

---

# 50. Continuous Integration

The CI pipeline should execute automated tests before merging changes into the main development branch.

Minimum CI sequence:

```text
Install dependencies
        ↓
Lint
        ↓
Type checks
        ↓
Unit tests
        ↓
Integration tests
        ↓
API tests
        ↓
Build validation
```

The exact CI platform is defined by the project infrastructure.

---

# 51. Pull Request Requirements

A pull request that modifies business or financial logic should include:

* relevant automated tests;
* explanation of the behavior changed;
* business rule reference;
* migration considerations if applicable;
* regression tests when fixing a defect.

Financial logic should not be merged based only on manual verification.

---

# 52. Coverage

Code coverage is a quality indicator, not the only measure of correctness.

The highest coverage priority should be:

```text
Financial calculators
Payment allocation
Loan services
Financial services
Authentication
Authorization
Critical API endpoints
```

A high percentage of coverage does not compensate for missing tests of critical business scenarios.

---

# 53. Critical Test Categories

The following areas are considered critical:

| Area                  | Priority |
| --------------------- | -------- |
| Interest calculations | Critical |
| Amortization          | Critical |
| Payment allocation    | Critical |
| Late fees             | Critical |
| Outstanding balances  | Critical |
| User isolation        | Critical |
| Payment persistence   | Critical |
| Transaction atomicity | Critical |
| Idempotency           | Critical |
| Financial balance     | High     |
| Collections           | High     |
| Authentication        | High     |
| Categories            | Medium   |
| Financial goals       | Medium   |
| UI details            | Medium   |

Critical tests must pass before a production release.

---

# 54. Release Quality Gates

A release must not proceed when:

* critical financial tests fail;
* authentication tests fail;
* user-isolation tests fail;
* payment allocation tests fail;
* database integrity tests fail;
* critical regression tests fail.

Warnings or non-critical failures may require explicit review before release.

---

# 55. Production Readiness

The financial engine is considered production-ready only when:

* fixed-principal calculations are tested;
* French amortization is tested;
* interest calculations are tested;
* late fees are tested;
* payment allocation is tested;
* partial payments are tested;
* multiple-installment payments are tested;
* date boundaries are tested;
* rounding behavior is tested;
* loan balances are tested;
* personal finance integration is tested;
* database transactions are tested;
* user isolation is tested;
* critical API workflows are tested;
* critical end-to-end workflows are tested.

---

# 56. Definition of Done — Testing

A feature is considered adequately tested when:

* expected behavior has automated tests;
* invalid behavior has appropriate tests;
* business rules are covered;
* important edge cases are covered;
* financial calculations are deterministic;
* relevant integration tests pass;
* no critical regression exists;
* authentication and authorization are verified where applicable;
* database integrity is verified where applicable;
* the test suite passes in CI.

---

# 57. Relationship with Business Rules

Testing must validate, not redefine, the business rules.

The authoritative documents are:

```text
docs/business/FINANCIAL_RULES.md
docs/business/LOAN_RULES.md
docs/business/PAYMENT_RULES.md
```

For example:

```text
Business rule
      ↓
Automated test
      ↓
Implementation
      ↓
Validation
```

If a test conflicts with an official business rule, the conflict must be resolved explicitly.

The test must not silently establish a new financial rule.

---

# 58. Testing and Product Specification

This document implements the testing requirements established by:

```text
docs/PRODUCT_SPECIFICATION.md
```

The product specification explicitly requires testing of:

* fixed principal;
* French amortization;
* full payments;
* partial payments;
* payments covering multiple installments;
* overdue payments;
* late fees;
* date transitions;
* February;
* leap years;
* year transitions.

These scenarios are therefore mandatory baseline coverage for PocketPal v1.0.

---

# 59. Versioning

This document represents:

```text
PocketPal Testing Strategy v1.0
```

Changes to testing requirements must be documented when they materially affect:

* financial integrity;
* release quality gates;
* business rule validation;
* security testing;
* production readiness.

Testing requirements must evolve together with the product and its business rules.
