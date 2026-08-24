# PocketPal — Database Specification

**Version:** 1.0
**Status:** Official Technical Specification
**Domain:** Database Architecture
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`
**Database:** PostgreSQL

---

# 1. Purpose

This document defines the database architecture for PocketPal.

It establishes:

* database technology;
* schema organization;
* entities;
* relationships;
* primary keys;
* foreign keys;
* monetary data types;
* constraints;
* indexes;
* auditability;
* deletion policies;
* data integrity;
* transaction boundaries;
* migration requirements.

The database must support both major PocketPal domains:

1. Personal finance.
2. Personal loan management.

The database is the persistent source of truth for financial records.

---

# 2. Database Technology

PocketPal v1.0 uses:

```text
PostgreSQL
```

The backend uses:

```text
SQLAlchemy 2
Alembic
```

The database must support:

* transactions;
* foreign keys;
* decimal arithmetic;
* check constraints;
* unique constraints;
* indexes;
* row-level consistency;
* reliable concurrent writes.

---

# 3. Database Design Principles

The database must follow these principles:

1. Financial data must be strongly typed.
2. Monetary values must use `NUMERIC`, never floating-point types.
3. Foreign keys must enforce relationships.
4. Financial history must be preserved.
5. Relevant financial records must not be physically deleted.
6. User data must be isolated.
7. Database constraints must protect business invariants where appropriate.
8. Derived financial values must not be independently editable without justification.
9. Important operations must be auditable.
10. Schema changes must be performed through migrations.
11. Naming must remain consistent across the entire database.
12. Database design must support deterministic financial calculations.

---

# 4. Database Schema Organization

The initial version may use a single PostgreSQL schema:

```text
public
```

Logical organization is achieved through domain-based tables.

The main groups are:

```text
Authentication
    users

Personal Finance
    categories
    transactions

Financial Goals
    financial_goals
    goal_contributions

Customers
    clients
    client_references

Loans
    loans
    loan_installments
    loan_payments
    payment_allocations
    late_fees

Auditing
    audit_logs
```

The database may be separated into PostgreSQL schemas in a future version if the system grows substantially.

---

# 5. Naming Conventions

Database objects use `snake_case`.

Examples:

```text
user_id
created_at
target_amount
payment_date
loan_installment_id
```

Table names should be plural.

Examples:

```text
users
clients
loans
transactions
```

Primary keys should normally use:

```text
id
```

Foreign keys should use:

```text
<entity>_id
```

Example:

```text
loan_id
client_id
user_id
```

---

# 6. Primary Key Strategy

PocketPal uses UUIDs for primary keys.

Conceptually:

```text
UUID
```

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

UUIDs provide:

* globally unique identifiers;
* safer public API identifiers;
* reduced predictability;
* easier distributed-system compatibility;
* independence from sequential database IDs.

The database should generate UUID values when possible.

---

# 7. Standard Timestamp Fields

Most persistent entities should include:

```text
created_at
updated_at
```

These fields represent system metadata.

They do not replace domain-specific dates.

For example:

```text
transaction_date
payment_date
start_date
due_date
```

must remain separate from:

```text
created_at
updated_at
```

---

# 8. User Entity

The `users` table represents authenticated PocketPal users.

Conceptual structure:

```text
users
-----
id
email
password_hash
full_name
currency
timezone
is_active
created_at
updated_at
```

### Fields

| Field           | Type        | Required | Description             |
| --------------- | ----------- | -------: | ----------------------- |
| `id`            | UUID        |      Yes | Primary key             |
| `email`         | VARCHAR     |      Yes | Unique login identifier |
| `password_hash` | TEXT        |      Yes | Hashed password         |
| `full_name`     | VARCHAR     |      Yes | User name               |
| `currency`      | CHAR(3)     |      Yes | Default currency        |
| `timezone`      | VARCHAR     |      Yes | User timezone           |
| `is_active`     | BOOLEAN     |      Yes | Account state           |
| `created_at`    | TIMESTAMPTZ |      Yes | Creation timestamp      |
| `updated_at`    | TIMESTAMPTZ |      Yes | Last update timestamp   |

Initial currency:

```text
COP
```

---

# 9. User Constraints

The database should enforce:

```text
email IS NOT NULL
email UNIQUE
password_hash IS NOT NULL
currency IS NOT NULL
timezone IS NOT NULL
```

Email comparisons should be handled consistently to avoid duplicate accounts caused by casing differences.

---

# 10. Categories

The `categories` table stores personal finance categories.

Conceptual structure:

```text
categories
----------
id
user_id
name
type
is_active
created_at
updated_at
```

### Type

```text
INCOME
EXPENSE
```

### Relationship

```text
users 1 ──── N categories
```

Every category belongs to one user.

---

# 11. Category Constraints

The database should enforce:

```text
user_id IS NOT NULL
name IS NOT NULL
type IS NOT NULL
```

Category type must be restricted to the supported values.

A user should not have duplicate active categories of the same type and name.

Conceptually:

```text
UNIQUE(user_id, type, normalized_name)
```

The exact normalization strategy belongs to the application/database implementation.

---

# 12. Financial Transactions

The `transactions` table stores personal income and expenses.

Conceptual structure:

```text
transactions
------------
id
user_id
category_id
type
amount
transaction_date
description
payment_method
notes
status
created_at
updated_at
```

### Type

```text
INCOME
EXPENSE
```

### Status

```text
ACTIVE
CANCELLED
```

---

# 13. Transaction Data Types

Recommended types:

```text
amount           NUMERIC(19,4)
transaction_date DATE
description      VARCHAR
payment_method   VARCHAR
notes            TEXT
```

Money must use:

```text
NUMERIC
```

and never:

```text
REAL
DOUBLE PRECISION
```

---

# 14. Transaction Constraints

The database should enforce:

```text
amount > 0
```

and:

```text
type IN ('INCOME', 'EXPENSE')
```

and:

```text
status IN ('ACTIVE', 'CANCELLED')
```

A cancelled transaction remains stored but must not contribute to active financial calculations.

---

# 15. Financial Goals

The `financial_goals` table stores user financial goals.

Conceptual structure:

```text
financial_goals
--------------
id
user_id
name
target_amount
target_date
status
description
created_at
updated_at
```

### Status

```text
ACTIVE
COMPLETED
CANCELLED
```

The current accumulated amount should preferably be derived from contributions instead of being independently editable.

---

# 16. Goal Contributions

The `goal_contributions` table stores individual contributions.

Conceptual structure:

```text
goal_contributions
------------------
id
goal_id
amount
contribution_date
description
status
created_at
updated_at
```

### Status

```text
ACTIVE
CANCELLED
```

Constraint:

```text
amount > 0
```

Relationship:

```text
financial_goals 1 ──── N goal_contributions
```

---

# 17. Goal Amount Calculation

The effective current amount should be calculated as:

```text
Current Amount =
SUM(active goal contributions)
```

Cancelled contributions must not contribute to the current amount.

This prevents the database from maintaining two independently mutable sources of truth:

```text
goal.current_amount
goal_contributions
```

The initial design therefore does not require `current_amount` as an authoritative stored field.

---

# 18. Clients

The `clients` table represents people who receive loans.

Conceptual structure:

```text
clients
-------
id
user_id
full_name
document_number
phone
alternative_phone
email
address
notes
status
created_at
updated_at
```

### Status

```text
ACTIVE
INACTIVE
```

Relationship:

```text
users 1 ──── N clients
```

A client belongs to exactly one PocketPal user.

---

# 19. Client References

The `client_references` table stores personal references.

Conceptual structure:

```text
client_references
-----------------
id
client_id
name
phone
address
relationship
notes
created_at
updated_at
```

Relationship:

```text
clients 1 ──── N client_references
```

References are informational.

They do not represent credit bureau records or external credit verification.

---

# 20. Loans

The `loans` table represents individual loans.

Conceptual structure:

```text
loans
-----
id
user_id
client_id
principal
start_date
interest_rate
interest_period
amortization_type
payment_frequency
number_of_installments
first_due_date
status
guarantee
notes
created_at
updated_at
```

### Status

```text
ACTIVE
PAID
OVERDUE
CANCELLED
```

---

# 21. Loan Monetary Fields

Recommended database representation:

```text
principal      NUMERIC(19,4)
interest_rate  NUMERIC(12,8)
```

The precision of `interest_rate` must allow the financial engine to perform calculations without premature rounding.

The exact interpretation of the rate is determined by:

```text
docs/business/LOAN_RULES.md
```

---

# 22. Loan Configuration Fields

`amortization_type`:

```text
FIXED_PRINCIPAL
FRENCH
```

`payment_frequency`:

```text
ONCE
DAILY
WEEKLY
BIWEEKLY
MONTHLY
CUSTOM
```

`interest_period` must represent the period associated with the configured rate.

The implementation should use controlled values rather than arbitrary free-form strings.

---

# 23. Loan Ownership

A loan must belong to both:

```text
user_id
client_id
```

The database relationship is:

```text
users 1 ──── N loans
clients 1 ──── N loans
```

The backend must ensure that:

```text
loan.user_id == client.user_id
```

This prevents one user from creating a loan associated with another user's client.

This invariant should be enforced at the application/service layer and, where practical, reinforced by database constraints.

---

# 24. Loan Installments

The `loan_installments` table stores the amortization schedule.

Conceptual structure:

```text
loan_installments
-----------------
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

---

# 25. Installment Status

Supported statuses:

```text
PENDING
PARTIAL
PAID
OVERDUE
CANCELLED
```

The status is derived from:

* due date;
* required amounts;
* payments allocated;
* cancellation state.

The frontend must not be the authority for installment status.

---

# 26. Installment Constraints

The database should enforce:

```text
installment_number > 0
principal_due >= 0
interest_due >= 0
late_fee_due >= 0
principal_paid >= 0
interest_paid >= 0
late_fee_paid >= 0
remaining_balance >= 0
```

The database should also enforce:

```text
UNIQUE(loan_id, installment_number)
```

An installment number must therefore be unique within a loan.

---

# 27. Installment Total

The expected installment total is conceptually:

```text
total_due =
    principal_due
    + interest_due
    + late_fee_due
```

The paid components are:

```text
principal_paid
interest_paid
late_fee_paid
```

The remaining obligation is derived from the difference between expected and paid components.

The authoritative calculation behavior belongs to the financial/payment services.

---

# 28. Loan Payments

The `loan_payments` table records payments received from customers.

Conceptual structure:

```text
loan_payments
------------
id
loan_id
client_id
amount
payment_date
payment_method
notes
status
created_at
updated_at
```

### Status

```text
ACTIVE
REVERSED
```

---

# 29. Payment Immutability

Payments are financial history.

The application must not physically delete a payment after it has been applied.

If a payment must be corrected:

```text
ACTIVE
   ↓
REVERSED
```

A reversal mechanism must preserve the original payment.

The resulting financial state must remain reconstructable.

---

# 30. Payment Allocations

A payment may cover:

* one installment;
* multiple installments;
* multiple financial components.

Therefore, the database requires an explicit allocation entity.

Conceptual structure:

```text
payment_allocations
-------------------
id
payment_id
installment_id

principal_amount
interest_amount
late_fee_amount

created_at
updated_at
```

Relationship:

```text
loan_payments 1 ──── N payment_allocations
loan_installments 1 ──── N payment_allocations
```

---

# 31. Payment Allocation Constraints

The database should enforce:

```text
principal_amount >= 0
interest_amount >= 0
late_fee_amount >= 0
```

An allocation cannot exceed the remaining amount of its corresponding obligation.

This rule must be enforced by the payment service within a database transaction.

---

# 32. Payment Allocation Total

For an individual allocation:

```text
allocation_total =
    principal_amount
    + interest_amount
    + late_fee_amount
```

The sum of all active allocations for a payment must not exceed:

```text
payment.amount
```

The sum of allocations may be lower than the payment amount only when the business rules explicitly permit an unapplied balance.

For v1.0, unexplained payment balances should normally be rejected.

---

# 33. Late Fees

Late fees are represented separately from ordinary interest.

The system may use a configuration entity and/or persisted fee records depending on implementation needs.

Recommended conceptual configuration:

```text
late_fee_configurations
-----------------------
id
loan_id
enabled
type
value
grace_period_days
created_at
updated_at
```

Supported types:

```text
FIXED_AMOUNT
PERCENTAGE
DAILY_PERCENTAGE
```

---

# 34. Persisted Late Fees

When a late fee becomes financially applicable, the system should preserve the resulting amount through the installment/payment model.

This prevents historical calculations from changing unexpectedly if the loan's configuration is modified later.

The exact persistence strategy must be consistent with:

```text
docs/business/LOAN_RULES.md
```

---

# 35. Audit Logs

The `audit_logs` table records important financial operations.

Conceptual structure:

```text
audit_logs
----------
id
user_id
action
entity_type
entity_id
metadata
created_at
```

Example actions:

```text
CREATE_LOAN
CANCEL_LOAN
CREATE_PAYMENT
REVERSE_PAYMENT
UPDATE_TRANSACTION
CANCEL_TRANSACTION
UPDATE_LOAN
```

`metadata` may use PostgreSQL:

```text
JSONB
```

---

# 36. Audit Log Immutability

Audit records should be append-only.

The application should not provide normal update/delete operations for audit logs.

An audit log represents historical evidence of an operation.

---

# 37. Foreign Key Deletion Policies

Financial records must not be accidentally removed through cascading deletes.

Therefore, relationships involving financial history should generally use:

```text
ON DELETE RESTRICT
```

or an equivalent application-level protection.

Examples:

```text
loans → loan_payments
loans → loan_installments
loan_payments → payment_allocations
```

must not allow deletion of the parent entity to silently destroy financial history.

---

# 38. User Deletion

Deleting a user must not automatically cascade through financial history without an explicit data-retention strategy.

If account deletion is introduced, the system should use an explicit lifecycle such as:

```text
ACTIVE
DEACTIVATED
DELETION_PENDING
DELETED
```

The exact retention policy belongs to the security/privacy specification.

---

# 39. Database Indexing Strategy

Indexes must support the most frequent queries.

Initial indexes should include:

```text
users(email)
```

```text
categories(user_id, type)
```

```text
transactions(user_id, transaction_date)
```

```text
transactions(user_id, type, transaction_date)
```

```text
financial_goals(user_id, status)
```

```text
goal_contributions(goal_id, contribution_date)
```

```text
clients(user_id, full_name)
```

```text
loans(user_id, status)
```

```text
loans(client_id, status)
```

```text
loan_installments(loan_id, due_date)
```

```text
loan_installments(status, due_date)
```

```text
loan_payments(loan_id, payment_date)
```

```text
payment_allocations(payment_id)
```

```text
payment_allocations(installment_id)
```

```text
audit_logs(user_id, created_at)
```

Indexes should be evaluated against real query performance before adding excessive indexes.

---

# 40. Collection Query Optimization

Today's collections are expected to be a frequent operation.

The database must efficiently support queries based on:

```text
due_date
status
loan_id
client_id
user_id
```

A suitable composite index should support filtering active installments by user and date.

Conceptually:

```text
(user_id, due_date, status)
```

Because `user_id` is not directly stored in `loan_installments` in the conceptual model, the final implementation may require either:

1. joining through `loans`; or
2. denormalizing `user_id` where justified.

The initial implementation should prefer normalized relationships unless performance measurements demonstrate a need for denormalization.

---

# 41. Search Indexes

Customer search should support common lookup fields:

```text
full_name
document_number
phone
```

Initial implementation may use standard B-tree indexes.

If fuzzy search becomes necessary, PostgreSQL extensions such as trigram indexing may be considered later.

This is outside the mandatory v1.0 schema.

---

# 42. Data Integrity Constraints

The database should enforce fundamental invariants whenever practical.

Examples:

```text
amount > 0
principal > 0
target_amount > 0
installment_number > 0
paid_amount >= 0
remaining_balance >= 0
```

Enumerated fields should also be restricted to known values.

Database constraints complement, but do not replace, business logic.

---

# 43. Derived Values

The following values should generally be derived rather than independently editable:

```text
personal balance
goal current amount
loan outstanding principal
installment remaining amount
total receivable
total overdue
```

The system should avoid storing duplicate sources of truth.

For example:

```text
loan.outstanding_principal
```

should not become independently editable if the authoritative value can be reconstructed from installments and payment allocations.

A cached value may be introduced later for performance, provided a reliable synchronization strategy exists.

---

# 44. Loan Balance Calculation

Conceptually:

```text
Outstanding Principal =
Original Principal
-
Principal Allocated to Active Payments
```

The actual calculation must account for:

* reversed payments;
* cancelled installments;
* payment allocation;
* rounding;
* business-specific loan rules.

The authoritative business behavior is defined outside this technical document.

---

# 45. Receivable Calculation

The total receivable represents outstanding obligations.

Conceptually:

```text
Receivable =
Outstanding Principal
+
Outstanding Interest
+
Outstanding Late Fees
```

The database must preserve these components independently.

This enables reports such as:

```text
Outstanding Principal
Outstanding Interest
Outstanding Late Fees
Total Receivable
```

without losing financial meaning.

---

# 46. Overdue Calculation

An installment becomes overdue when:

```text
due_date < current_business_date
```

and:

```text
outstanding_amount > 0
```

The exact treatment of grace periods and late fees belongs to:

```text
docs/business/LOAN_RULES.md
```

The backend is responsible for determining the effective state.

---

# 47. Transactional Payment Registration

Payment registration must occur inside a database transaction.

Conceptually:

```text
BEGIN

Create payment
        ↓
Validate loan
        ↓
Validate installment obligations
        ↓
Calculate allocation
        ↓
Create payment allocations
        ↓
Update affected installment state
        ↓
Update related financial records
        ↓
Create audit record

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

No partial payment state should remain.

---

# 48. Concurrent Payments

The database must protect against two simultaneous requests applying the same obligation.

For example:

```text
Request A → payment $100,000
Request B → payment $100,000
```

must not both independently assume that the same $100,000 installment balance is available.

The payment service must use appropriate transaction isolation and/or row locking.

Possible mechanisms include:

```text
SELECT ... FOR UPDATE
```

on affected installments.

The exact implementation belongs to the backend architecture.

---

# 49. Idempotency

Important financial operations should support idempotency where appropriate.

Payment registration is a primary candidate.

The system may use an idempotency key such as:

```text
idempotency_key
```

associated with the operation.

The database should enforce uniqueness for the combination required by the API design.

Example:

```text
UNIQUE(user_id, idempotency_key)
```

This prevents retries from creating duplicate payments.

---

# 50. Database Transactions

The following operations must be transactional:

* creating a loan and its schedule;
* registering a payment;
* reversing a payment;
* cancelling a financial transaction;
* creating a goal contribution;
* operations that modify multiple related financial records.

A financial operation is considered successful only when all related database changes are committed.

---

# 51. Loan Creation Transaction

Creating a loan should conceptually execute:

```text
BEGIN

Create loan
      ↓
Validate configuration
      ↓
Calculate amortization schedule
      ↓
Create installments
      ↓
Create audit record

COMMIT
```

If schedule generation fails:

```text
ROLLBACK
```

The loan must not exist without its required schedule.

---

# 52. Payment Reversal Transaction

Payment reversal should conceptually execute:

```text
BEGIN

Validate payment
      ↓
Mark payment REVERSED
      ↓
Reverse active allocations
      ↓
Recalculate affected installments
      ↓
Update loan state
      ↓
Update related financial records
      ↓
Create audit record

COMMIT
```

A reversed payment remains in the database.

---

# 53. Database Migrations

All schema changes must be managed using:

```text
Alembic
```

Migrations must be:

* versioned;
* reversible where practical;
* tested;
* committed to source control.

Examples:

```text
alembic revision
alembic upgrade
alembic downgrade
```

The application must not silently modify the production schema during startup.

---

# 54. Initial Migration Order

The initial schema should be created in dependency order.

Recommended sequence:

```text
1. users
2. categories
3. clients
4. financial_goals
5. transactions
6. goal_contributions
7. client_references
8. loans
9. loan_installments
10. late_fee_configurations
11. loan_payments
12. payment_allocations
13. audit_logs
```

Foreign keys must only reference tables that already exist.

---

# 55. Seed Data

Initial category seed data may be created for each user when the account is initialized.

Income:

```text
Salary
Freelance
Business
Interest
Other
```

Expenses:

```text
Food
Transportation
Housing
Utilities
Education
Health
Entertainment
Shopping
Technology
Debt
Other
```

Seed data must not create global mutable categories unless the architecture explicitly supports them.

---

# 56. Database Environment Configuration

Database credentials must never be hard-coded.

Environment variables should provide values such as:

```text
DATABASE_URL
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```

Secrets must not be committed to source control.

---

# 57. Local Development

The recommended local environment is PostgreSQL running through Docker.

Conceptually:

```text
Mobile App
     │
     ▼
FastAPI
     │
     ▼
SQLAlchemy
     │
     ▼
PostgreSQL
```

Database migrations are executed through Alembic.

---

# 58. Production Considerations

The production PostgreSQL environment should provide:

* encrypted connections where applicable;
* automated backups;
* restricted network access;
* credential rotation;
* monitoring;
* connection pooling;
* migration control;
* recovery procedures.

The database must not be publicly exposed directly to the internet.

Only the backend should communicate with PostgreSQL.

---

# 59. Backup and Recovery

Financial data requires reliable backup procedures.

The production environment should support:

```text
automated backups
point-in-time recovery
backup verification
restore testing
```

A backup is not considered reliable until restoration has been tested.

Backup strategy belongs to the infrastructure/deployment documentation.

---

# 60. Data Retention

Financial records should be retained for as long as required by the product's data-retention policy.

The database must prioritize historical integrity.

Deletion of financial history must not be implemented simply as:

```text
DELETE FROM ...
```

without considering:

* dependent records;
* audit logs;
* reports;
* financial reconstruction;
* legal/privacy requirements.

---

# 61. Logical Relationship Model

The core domain relationships are:

```text
User
 │
 ├── Categories
 │      │
 │      └── Transactions
 │
 ├── Financial Goals
 │      │
 │      └── Goal Contributions
 │
 └── Clients
        │
        ├── Client References
        │
        └── Loans
              │
              ├── Loan Installments
              │
              ├── Late Fee Configuration
              │
              └── Loan Payments
                       │
                       └── Payment Allocations
                                │
                                └── Loan Installments
```

Auditing is cross-domain:

```text
User
 │
 └── Audit Logs
        │
        ├── Transactions
        ├── Loans
        ├── Payments
        └── Other sensitive operations
```

---

# 62. Entity Relationship Summary

| Entity                 | Parent           | Cardinality |
| ---------------------- | ---------------- | ----------- |
| User                   | —                | —           |
| Category               | User             | N:1         |
| Transaction            | User             | N:1         |
| Transaction            | Category         | N:1         |
| Financial Goal         | User             | N:1         |
| Goal Contribution      | Financial Goal   | N:1         |
| Client                 | User             | N:1         |
| Client Reference       | Client           | N:1         |
| Loan                   | User             | N:1         |
| Loan                   | Client           | N:1         |
| Loan Installment       | Loan             | N:1         |
| Late Fee Configuration | Loan             | N:1         |
| Loan Payment           | Loan             | N:1         |
| Loan Payment           | Client           | N:1         |
| Payment Allocation     | Loan Payment     | N:1         |
| Payment Allocation     | Loan Installment | N:1         |
| Audit Log              | User             | N:1         |

---

# 63. Separation Between Domains

The database must preserve a clear separation between:

```text
Personal Finance
```

and:

```text
Loan Management
```

However, they may be integrated through financial effects.

The loan system remains authoritative for:

```text
principal
interest
late fees
installments
payment allocation
outstanding balances
```

The personal finance system remains authoritative for:

```text
income
expenses
categories
goals
personal financial transactions
```

This separation prevents duplicated financial logic.

---

# 64. Financial Integrity Rules

The following invariants are mandatory:

```text
Money > 0 for normal monetary inputs
```

```text
Outstanding principal >= 0
```

```text
Outstanding interest >= 0
```

```text
Outstanding late fees >= 0
```

```text
Allocated payment amounts >= 0
```

```text
Allocated amount <= available obligation
```

```text
Payment allocations <= payment amount
```

```text
Cancelled financial records remain persisted
```

```text
Reversed payments remain persisted
```

```text
Every financial record belongs to a user
```

---

# 65. Database vs Business Logic

Not every business rule belongs inside PostgreSQL.

The database should enforce fundamental structural invariants:

```text
NOT NULL
UNIQUE
FOREIGN KEY
CHECK
```

The application/service layer should handle complex rules such as:

```text
payment allocation
interest calculation
amortization
late-fee calculation
loan status transitions
```

The financial calculation layer must remain independent from database-specific implementation wherever practical.

---

# 66. Source of Truth

The authoritative sources are:

```text
Database
    ↓
Persisted financial records
    ↓
Backend financial services
    ↓
API responses
    ↓
Mobile UI
```

The mobile application must never become a source of truth for:

* balances;
* interest;
* payment allocation;
* installment state;
* overdue state;
* loan principal.

---

# 67. Reporting Queries

Reports should be generated from persisted data.

Examples:

```text
Monthly income
Monthly expenses
Monthly balance
Outstanding principal
Outstanding interest
Outstanding late fees
Total receivable
Overdue amount
Collected interest
Collected principal
```

Reporting queries must preserve the distinction between:

```text
principal
interest
late_fee
```

This is necessary for accurate financial analysis.

---

# 68. Performance Strategy

The initial database should prioritize:

1. correctness;
2. consistency;
3. maintainability;
4. adequate indexing.

Premature denormalization should be avoided.

If performance issues emerge, optimization may include:

* additional indexes;
* materialized views;
* cached aggregates;
* query optimization;
* partitioning for large historical tables.

These optimizations must never compromise financial correctness.

---

# 69. Future Database Extensions

The architecture should leave room for future support of:

* multiple currencies;
* multiple financial accounts;
* bank accounts;
* wallets;
* advanced reporting;
* recurring transactions;
* richer audit history;
* notifications;
* refinancing;
* additional loan products.

These features are outside v1.0 and must not unnecessarily complicate the initial schema.

---

# 70. Definition of Done

The database specification is considered implementation-ready when:

* all core entities are defined;
* relationships are defined;
* primary keys are defined;
* foreign keys are defined;
* monetary fields use decimal types;
* required constraints are documented;
* deletion behavior is defined;
* indexes are identified;
* transactional operations are identified;
* audit requirements are defined;
* migration strategy is defined;
* financial source-of-truth responsibilities are clear.

---

# 71. Relationship With Other Documentation

This document works together with:

```text
docs/PRODUCT_SPECIFICATION.md
docs/business/FINANCIAL_RULES.md
docs/business/LOAN_RULES.md
docs/business/PAYMENT_RULES.md
docs/technical/ARCHITECTURE.md
docs/technical/API.md
docs/technical/SECURITY.md
```

Business documents define **what the system must do**.

This document defines **how persistent data is structured to support those rules**.

The architecture document defines **how application components interact with the database**.

The API document defines **how external clients access the backend**.

The security document defines **how database and application data are protected**.

---

# 72. Versioning

This document represents:

```text
PocketPal Database Specification v1.0
```

Any database change that affects financial meaning, historical records, or calculation behavior must include:

1. documentation update;
2. migration strategy;
3. compatibility analysis;
4. test coverage;
5. rollback/recovery considerations.

Database changes affecting financial data must never be performed silently.

---

# 73. Final Database Principle

PocketPal's database must be designed around one fundamental principle:

```text
Financial history must remain accurate, traceable and reconstructable.
```

The database is not merely storage.

It is the persistent foundation that allows PocketPal to calculate, audit and explain the user's financial state.

Therefore:

```text
Correctness > Convenience
Traceability > Destructive Editing
Consistency > Premature Optimization
Backend Rules > Frontend Calculations
```
