# PocketPal — Financial Business Rules

**Version:** 1.0
**Status:** Official Business Rules
**Domain:** Personal Finance
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`

---

# 1. Purpose

This document defines the business rules that govern personal financial information inside PocketPal.

It establishes how the application handles:

* income;
* expenses;
* financial balance;
* categories;
* financial goals;
* goal contributions;
* loan-related financial movements;
* monetary values;
* dates;
* transaction history.

The purpose is to ensure that financial information is consistent, predictable and auditable.

Loan-specific calculation rules are defined separately in:

```text
docs/business/LOAN_RULES.md
```

Payment allocation rules are defined in:

```text
docs/business/PAYMENT_RULES.md
```

---

# 2. Financial Data Principles

PocketPal must follow these principles:

1. Money must always be represented using exact decimal arithmetic.
2. Floating-point arithmetic must not be used for monetary calculations.
3. Every financial movement must have a date.
4. Historical financial records must not be silently overwritten.
5. Financial calculations must be performed by the backend.
6. The frontend must never be the authoritative source of financial balances.
7. Financial records must belong to a specific user.
8. Every financial movement must have a clear type.
9. Calculated values must be reproducible from persisted data.
10. Financial operations must maintain traceability.

---

# 3. Monetary Representation

All monetary values must use decimal arithmetic.

Conceptually:

```text
Decimal
```

must be used instead of:

```text
float
```

Example:

```text
100,000.00
```

is a valid monetary value.

The application must not internally represent money as:

```text
100000.00000000001
```

due to floating-point precision errors.

---

# 4. Currency

The initial version of PocketPal is designed for a single primary currency per user.

The default currency for the initial product is:

```text
COP
```

Colombian Peso.

The architecture should not make future multi-currency support impossible.

However, multi-currency financial calculations are outside the scope of v1.0.

---

# 5. Financial Transaction Types

Personal financial transactions have two primary types:

```text
INCOME
EXPENSE
```

## INCOME

Represents money received by the user.

Examples:

* salary;
* freelance work;
* business income;
* interest received;
* other income.

## EXPENSE

Represents money spent by the user.

Examples:

* food;
* transportation;
* utilities;
* education;
* entertainment;
* purchases.

---

# 6. Transaction Amount

A transaction amount must always be positive.

The transaction type determines whether it increases or decreases the personal financial balance.

Example:

```text
INCOME
amount = 500000
```

means:

```text
+500,000
```

while:

```text
EXPENSE
amount = 500,000
```

means:

```text
-500,000
```

The database should not require negative amounts for expenses.

This avoids ambiguity.

---

# 7. Balance Calculation

The basic personal balance is:

```text
Balance = Total Income - Total Expenses
```

Example:

```text
Income:
$3,000,000

Expenses:
$1,200,000

Balance:
$1,800,000
```

The balance should be calculated from persisted transactions rather than stored as an independently editable number.

---

# 8. Transaction Dates

Every transaction must have a transaction date.

The transaction date represents when the financial event occurred.

The application may also store:

```text
created_at
updated_at
```

These timestamps represent system metadata and are not substitutes for the actual transaction date.

Example:

```text
transaction_date = 2026-08-21
created_at       = 2026-08-22
```

The transaction belongs financially to August 21.

---

# 9. Future-Dated Transactions

The system may allow future-dated transactions.

However, future transactions must not automatically be treated as already realized financial movements in current balance calculations unless explicitly configured.

For v1.0, the default behavior should be:

```text
Current Balance
=
Transactions whose transaction date is <= today
```

Future financial planning may be introduced later.

---

# 10. Categories

Every personal income or expense transaction should have a category.

Categories must be associated with the user.

Initial income categories:

```text
Salary
Freelance
Business
Interest
Other
```

Initial expense categories:

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

---

# 11. Category Requirements

Categories must have:

```text
id
user_id
name
type
is_active
created_at
updated_at
```

Category type:

```text
INCOME
EXPENSE
```

An income category should not normally be selectable for an expense.

An expense category should not normally be selectable for an income.

---

# 12. Category Deactivation

Categories should not be physically deleted when they have historical transactions.

Instead, they should be deactivated.

Example:

```text
is_active = false
```

A deactivated category:

* remains visible in historical transactions;
* cannot normally be selected for new transactions;
* does not destroy historical data.

This preserves financial history.

---

# 13. Transaction Editing

Transactions may be edited when appropriate.

However, modifications to financial records must preserve auditability.

The system should maintain:

```text
created_at
updated_at
```

For high-value or sensitive operations, an audit record should be generated.

The application must not silently modify historical financial information without traceability.

---

# 14. Transaction Deletion

Physical deletion of financial transactions should be avoided.

If the product requires removing a transaction from active calculations, the preferred mechanism is a reversible cancellation or soft deletion.

For example:

```text
status = CANCELLED
```

rather than deleting the record.

Historical data must remain reconstructable.

---

# 15. Cancelled Transactions

A cancelled transaction must not contribute to the active balance.

Example:

```text
Income:
$2,000,000

Cancelled income:
$500,000

Effective income:
$1,500,000
```

The cancelled transaction remains available for audit/history purposes.

---

# 16. Duplicate Transactions

PocketPal should minimize accidental duplicate financial records.

Before creating a transaction, the application may perform client-side validation and user confirmation.

The backend should use appropriate safeguards where an operation could be retried.

Important financial operations should be designed to be idempotent where technically appropriate.

---

# 17. Payment Methods

The initial application may support payment/receiving methods such as:

```text
CASH
BANK_TRANSFER
CARD
OTHER
```

The exact visible labels may be localized.

Payment method is descriptive metadata and does not itself determine the financial transaction type.

---

# 18. Financial Goals

A financial goal represents an amount the user wants to accumulate for a specific purpose.

Examples:

```text
Buy a computer
Emergency fund
Education
Travel
```

A goal has:

```text
target_amount
current_amount
target_date
status
```

---

# 19. Goal Status

Initial goal statuses:

```text
ACTIVE
COMPLETED
CANCELLED
```

A goal is considered completed when:

```text
current_amount >= target_amount
```

The application should not automatically increase the target amount when the current amount exceeds it.

---

# 20. Goal Progress

Goal progress is:

```text
Progress =
(current_amount / target_amount) * 100
```

The displayed value may be capped at:

```text
100%
```

even if the actual accumulated amount exceeds the target.

Example:

```text
Target:
$1,000,000

Saved:
$1,200,000

Actual:
120%

Displayed progress:
100%
```

The actual saved amount remains:

```text
$1,200,000
```

---

# 21. Goal Contributions

A contribution represents money allocated toward a goal.

Each contribution should contain:

```text
id
goal_id
amount
date
description
created_at
```

A contribution must always have a positive amount.

The goal's current amount should be derived from valid contributions rather than manually edited.

Conceptually:

```text
Current Amount =
SUM(valid goal contributions)
```

---

# 22. Goal Contribution Cancellation

A contribution should not be physically deleted after it has affected financial history.

If a contribution must be reversed, the system should support a compensating/reversal operation.

This preserves the original history.

---

# 23. Goal and Personal Balance

A goal represents allocation/planning of personal money.

Moving money toward a goal must not automatically be treated as a personal expense.

Example:

```text
Income:
$2,000,000

Expense:
$1,000,000

Goal contribution:
$500,000
```

The basic personal balance remains:

```text
$1,000,000
```

The goal contribution represents an allocation of available money rather than an expense.

The detailed treatment of goal funds in future account/cash-flow features may evolve.

---

# 24. Loans and Personal Finance

Loan activity is a separate business domain from personal income and expenses.

A loan contains financial components that must be distinguished:

```text
Principal
Interest
Late Fee
```

When the user receives a loan payment:

* principal recovery represents recovery of previously lent capital;
* interest represents financial income;
* late fee represents a separate income component.

The system must not automatically classify the entire loan payment as personal income.

---

# 25. Principal Recovery

Suppose the user lent:

```text
$1,000,000
```

and receives:

```text
$120,000
```

where:

```text
Principal:
$100,000

Interest:
$20,000
```

Only:

```text
$20,000
```

should be considered interest income.

The:

```text
$100,000
```

is recovery of previously lent principal.

This distinction is fundamental to PocketPal.

---

# 26. Interest Income

Interest received from loans may be represented as personal financial income.

Conceptually:

```text
Income category:
Interest
```

However, the loan system remains the authoritative source for determining how much of a payment represents interest.

The personal finance module must consume that information rather than independently recalculating it.

---

# 27. Late Fee Income

Late fees received from customers are separate from ordinary interest.

They may eventually be reflected as a separate income category or financial component.

The application must preserve the distinction:

```text
Interest
≠
Late Fee
```

This distinction is required for reporting.

---

# 28. Lending Principal

When the user creates a loan, the amount lent represents capital leaving the user's available personal funds and becoming outstanding loan principal.

However, it should not be treated as a normal personal expense.

Example:

```text
Available personal money:
$3,000,000

New loan:
$1,000,000

Outstanding loan principal:
$1,000,000
```

The system must avoid classifying the $1,000,000 as consumption or expense.

It is a change in financial position.

---

# 29. Financial Position vs Expense

PocketPal must distinguish between:

```text
Expense
```

and:

```text
Asset / outstanding principal
```

A personal expense represents money consumed or spent.

A loan principal represents money transferred into an outstanding receivable.

Therefore:

```text
Loan principal ≠ Expense
```

This distinction is essential for future financial reporting.

---

# 30. Loan Payment and Balance Integration

When a customer makes a payment:

```text
Customer payment
        ↓
Payment allocation
        ↓
Principal recovered
Interest received
Late fee received
        ↓
Loan balances updated
        ↓
Personal financial records updated where applicable
```

The loan engine determines the allocation.

The personal finance system records the resulting financial effects.

---

# 31. Avoiding Double Counting

PocketPal must prevent situations where the same financial event is counted twice.

Example:

A customer pays:

```text
$120,000
```

with:

```text
$100,000 principal
$20,000 interest
```

The system must not record:

```text
$120,000 income
+
$20,000 interest income
```

because that would produce:

```text
$140,000
```

instead of:

```text
$20,000
```

of income.

Principal recovery and income must remain distinct.

---

# 32. Financial Reporting Periods

The application should support reporting by:

```text
Day
Week
Month
Year
Custom period
```

For v1.0, monthly reporting is particularly important.

Examples:

```text
Monthly income
Monthly expenses
Monthly balance
Monthly interest received
Monthly late fees received
Monthly principal recovered
```

---

# 33. Date and Timezone

The application must use a consistent user timezone for financial dates.

The user's configured timezone should determine:

* current date;
* today's collections;
* overdue determination;
* daily reports;
* transaction date defaults.

Backend timestamps should be stored consistently.

The exact timezone implementation belongs to the technical architecture.

---

# 34. Rounding

Monetary calculations must follow deterministic rounding rules.

The application must not produce inconsistent results between:

* backend;
* frontend;
* reports;
* database values.

Internal calculations should maintain sufficient precision.

Rounding should occur at defined financial boundaries.

Loan-specific rounding rules belong to:

```text
docs/business/LOAN_RULES.md
```

---

# 35. Negative Financial Values

User-created transaction amounts should normally be positive.

The semantic direction is determined by the transaction type.

For example:

```text
INCOME +100000
EXPENSE -100000
```

should not be represented as a negative expense input.

This reduces input errors.

---

# 36. Zero-Value Transactions

Zero-value income and expense transactions should normally be rejected.

A financial transaction should represent an actual financial movement.

Therefore:

```text
amount > 0
```

is required for normal transaction creation.

---

# 37. Historical Consistency

Historical calculations should remain reproducible.

If a category name changes from:

```text
Transportation
```

to:

```text
Transport
```

historical transactions should remain associated with the same category identity.

Changing display metadata must not change historical financial meaning.

---

# 38. User Data Isolation

Every financial record must belong to a specific authenticated user.

A user must never be able to access another user's:

* transactions;
* goals;
* customers;
* loans;
* payments;
* reports.

This is both a security requirement and a financial integrity requirement.

---

# 39. Auditability

Important financial operations should be auditable.

Potential audited actions include:

* creating a loan;
* cancelling a loan;
* registering a payment;
* reversing a payment;
* modifying a financial transaction;
* cancelling a financial transaction;
* modifying important loan configuration.

Audit records should identify:

```text
user
action
entity
entity_id
timestamp
relevant metadata
```

---

# 40. Business Rule Priority

When financial rules conflict, priority should be:

1. Financial integrity.
2. Historical accuracy.
3. Deterministic calculation.
4. Auditability.
5. User experience.
6. Convenience.

The application must never sacrifice financial correctness merely to simplify the interface.

---

# 41. Relationship with Other Business Rules

This document defines general financial behavior.

The responsibilities are separated as follows:

```text
FINANCIAL_RULES.md
        │
        ├── Personal income
        ├── Personal expenses
        ├── Balance
        ├── Categories
        ├── Goals
        └── Loan financial integration
                    │
                    ▼
              LOAN_RULES.md
                    │
                    ├── Interest
                    ├── Amortization
                    ├── Schedules
                    ├── Due dates
                    └── Late fees
                    │
                    ▼
             PAYMENT_RULES.md
                    │
                    ├── Payment allocation
                    ├── Partial payments
                    ├── Multiple installments
                    ├── Reversals
                    └── Payment history
```

Each document must remain responsible for its own domain.

---

# 42. Versioning

This document represents:

```text
PocketPal Financial Rules v1.0
```

Any modification that changes the financial meaning of existing records must result in an explicit documentation update and migration strategy.

Business rules must never be changed silently after implementation.
