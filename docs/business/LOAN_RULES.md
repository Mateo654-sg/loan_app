# PocketPal — Loan Business Rules

**Version:** 1.0  
**Status:** Official Business Rules  
**Domain:** Personal Loan Management  
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`  
**Related documents:**
- `docs/business/FINANCIAL_RULES.md`
- `docs/business/PAYMENT_RULES.md`

---

# 1. Purpose

This document defines the business rules governing personal loans in PocketPal.

It establishes how the system must handle:

- loan creation;
- loan principal;
- interest;
- interest periods;
- amortization;
- payment frequencies;
- installment schedules;
- due dates;
- outstanding balances;
- late fees;
- overdue installments;
- loan statuses;
- loan completion;
- loan cancellation;
- financial calculations.

This document defines the financial behavior of loans.

Payment allocation and payment history rules are defined separately in:

```text
docs/business/PAYMENT_RULES.md

General personal finance rules are defined in:

docs/business/FINANCIAL_RULES.md
2. Core Principle

A loan represents money lent by the PocketPal user to a customer.

The original amount lent is called:

Principal

The customer may subsequently owe:

Principal
+
Interest
+
Late Fees

These components must always remain conceptually separate.

3. Loan Lifecycle

A loan follows a controlled lifecycle:

CREATED
   ↓
ACTIVE
   ↓
 ┌───────────────┐
 │               │
 ▼               ▼
PAID          OVERDUE
 │               │
 │               │
 └───────┬───────┘
         ▼
       PAID

A loan may also be:

CANCELLED

when cancellation is permitted according to business rules.

4. Loan Statuses

Initial statuses:

ACTIVE
OVERDUE
PAID
CANCELLED
ACTIVE

The loan has outstanding obligations and none of the relevant obligations are currently overdue.

OVERDUE

At least one outstanding installment is past its due date.

PAID

All financial obligations associated with the loan have been completely settled.

CANCELLED

The loan has been explicitly cancelled according to an allowed business operation.

A cancelled loan must remain in historical records.

5. Loan Principal

The principal is the amount originally lent.

Example:

Principal = $1,000,000

The principal is not interest and is not a personal expense.

The system must track at least:

original_principal
outstanding_principal

Initially:

original_principal = $1,000,000
outstanding_principal = $1,000,000

After $100,000 of principal has been recovered:

outstanding_principal = $900,000
6. Principal Invariant

The outstanding principal must never be negative.

Therefore:

outstanding_principal >= 0

A payment must never cause:

outstanding_principal < 0

Any excess amount must be handled according to the payment rules.

7. Interest

Interest represents the financial charge applied to the outstanding loan balance according to the loan configuration.

Interest must be stored/calculated separately from principal.

Conceptually:

Amount owed =
Principal
+
Interest
+
Late Fees

Interest must never be silently included in the principal unless a future explicitly supported capitalization rule exists.

8. Interest Rate

Each loan must define an interest rate.

Example:

interest_rate = 10%

The rate must be represented as an exact decimal value.

The system must not use floating-point arithmetic for interest calculations.

9. Interest Period

The interest rate must always have an associated period.

Supported initial periods:

DAILY
WEEKLY
BIWEEKLY
MONTHLY
YEARLY

Example:

10% MONTHLY

is different from:

10% YEARLY

The system must never interpret a rate without its period.

10. Interest Configuration

A loan's interest configuration conceptually contains:

interest_rate
interest_period

Example:

interest_rate = 5
interest_period = MONTHLY

means:

5% per month

The UI should display this explicitly to prevent ambiguity.

For example:

5% mensual

rather than simply:

5%
11. Interest Calculation Basis

The basis used to calculate interest depends on the amortization type.

For:

FIXED_PRINCIPAL

interest is calculated against the outstanding principal for the corresponding period.

For:

FRENCH

interest is calculated according to the outstanding amortization balance.

The calculation must be performed by the backend loan calculator.

12. Fixed Principal Amortization

In fixed-principal amortization, the principal component is distributed across installments.

Example:

Principal: $1,000,000
Installments: 10

Base principal per installment:

$1,000,000 / 10
=
$100,000

Each installment therefore initially contains:

Principal = $100,000

plus the applicable interest.

13. Fixed Principal Interest

For fixed-principal loans, interest is calculated using the outstanding principal for the corresponding period.

Example:

Principal:
$1,000,000

Monthly interest:
10%

First period:

Interest =
$1,000,000 × 10%
=
$100,000

After a principal payment of:

$100,000

remaining principal:

$900,000

Second period:

Interest =
$900,000 × 10%
=
$90,000

This means the interest component normally decreases as principal is repaid.

14. French Amortization

French amortization uses a fixed periodic payment, subject to rounding.

For a standard periodic interest rate:

r

principal:

P

and number of installments:

n

the theoretical periodic payment is:

Payment =
P × [r(1+r)^n] / [(1+r)^n - 1]

The implementation must calculate the schedule using exact decimal arithmetic.

15. French Amortization Components

Each French installment contains:

total_payment
interest
principal
remaining_balance

For each installment:

interest =
previous_balance × periodic_rate

Then:

principal =
total_payment - interest

Then:

remaining_balance =
previous_balance - principal

The final installment must be adjusted if necessary to eliminate residual rounding differences.

16. Interest Rate Conversion

The system must not assume that an annual interest rate can simply be divided by 12 in every possible financial model.

For v1.0, PocketPal uses the explicitly configured interest period as the calculation period.

For example:

10% MONTHLY

means:

10% per monthly period

If the product later introduces annual-to-period conversion, the conversion methodology must be explicitly documented before implementation.

17. Payment Frequency

Supported payment frequencies:

ONCE
DAILY
WEEKLY
BIWEEKLY
MONTHLY
CUSTOM

The payment frequency determines the interval between installment due dates.

18. ONCE Frequency

A one-time loan has a single scheduled installment.

Example:

Loan date:
2026-08-21

Due date:
2026-09-21

There is only one installment.

The installment contains the complete outstanding obligation according to the configured loan rules.

19. DAILY Frequency

Daily payments generate installments at daily intervals.

Example:

Start:
2026-08-21

Installment 1:
2026-08-22

Installment 2:
2026-08-23

Installment 3:
2026-08-24

Date calculations must respect the user's configured timezone.

20. WEEKLY Frequency

Weekly payments generate installments every seven days.

Example:

2026-08-21
2026-08-28
2026-09-04
2026-09-11
21. BIWEEKLY Frequency

Biweekly payments generate installments every fourteen days.

Example:

2026-08-21
2026-09-04
2026-09-18
2026-10-02
22. MONTHLY Frequency

Monthly payments generate installments according to calendar months.

Example:

2026-01-15
2026-02-15
2026-03-15
2026-04-15

The implementation must handle months with different numbers of days.

23. End-of-Month Dates

Monthly schedules require special handling for dates such as:

January 31

If the next month does not contain that day, the system must apply a deterministic rule.

For v1.0, the recommended rule is:

Use the last valid day of the target month.

Example:

January 31
↓
February 28

and in a leap year:

January 31
↓
February 29

This behavior must be tested.

24. Custom Frequency

CUSTOM allows future support for user-defined schedules.

The v1.0 implementation should not introduce arbitrary scheduling complexity unless required.

If implemented, every installment must explicitly contain its due date.

The schedule itself becomes the source of truth for installment dates.

25. Number of Installments

A loan must define its number of installments unless the selected configuration explicitly represents a one-time obligation.

Example:

principal = $1,000,000
installments = 10

The system must reject:

installments <= 0
26. First Due Date

A loan must define the first due date.

The first due date must not be earlier than the loan start date unless an explicit business rule allows it.

Default rule:

first_due_date >= start_date
27. Installment Numbering

Installments must be sequentially numbered.

Example:

1
2
3
4
...
10

Installment numbers must be unique within a loan.

28. Installment Structure

Each installment should contain:

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
29. Installment Status

Initial statuses:

PENDING
PARTIAL
PAID
OVERDUE
CANCELLED
PENDING

The installment has not reached its due date and has an outstanding balance.

PARTIAL

A payment has been made but the installment still has an outstanding balance.

PAID

The installment's required financial obligations have been completely settled.

OVERDUE

The installment has an outstanding balance and its due date has passed.

CANCELLED

The installment has been explicitly cancelled.

30. Overdue Determination

An installment is overdue when:

current_date > due_date

and:

outstanding_amount > 0

Therefore:

due_date passed
+
balance > 0
=
OVERDUE

A paid installment cannot become overdue simply because its due date has passed.

31. Days Overdue

Days overdue are calculated as:

days_overdue =
current_date - due_date

for installments that are overdue.

Example:

Due date:
2026-08-20

Current date:
2026-08-23

Days overdue:
3

If the installment is not overdue:

days_overdue = 0
32. Grace Period

Late-fee calculations may define a grace period.

Example:

grace_period_days = 3

This means a late fee should not be applied before the configured grace period has elapsed.

The exact late-fee calculation is defined below and must remain separate from ordinary interest.

33. Late Fees

Late fees are additional charges resulting from overdue obligations.

They are separate from:

principal
interest

Supported initial types:

FIXED_AMOUNT
PERCENTAGE
DAILY_PERCENTAGE
34. Fixed Late Fee

A fixed late fee applies a predetermined monetary amount.

Example:

Late fee:
$10,000

Once the applicable late condition is met, the fee is:

$10,000

unless a future rule defines repeated application.

35. Percentage Late Fee

A percentage late fee applies a percentage to a defined base.

The base must be explicitly defined by the implementation.

For v1.0, the recommended default base is:

outstanding principal

Example:

Outstanding principal:
$500,000

Late fee:
5%

Late fee:
$25,000

The system must never apply a percentage to an ambiguous total.

36. Daily Percentage Late Fee

A daily percentage late fee may apply according to the number of overdue days.

Conceptually:

late_fee =
base_amount
×
daily_rate
×
eligible_overdue_days

Example:

Base:
$500,000

Daily late rate:
0.1%

Days:
5

Then:

$500,000 × 0.001 × 5
=
$2,500

The exact compounding behavior must remain non-compounding unless explicitly changed in a future version.

37. Late Fee Non-Compounding Rule

Late fees must not automatically generate additional interest or additional late fees.

Therefore:

Late fee
≠
Principal

and:

Late fee
≠
Interest base

unless an explicit future rule states otherwise.

This prevents uncontrolled fee growth.

38. Interest vs Late Fee

PocketPal must always distinguish:

Interest

from:

Late Fee

Interest is generated according to the loan's normal financial terms.

Late fees are generated because an obligation was not paid according to its due date.

They must be represented separately in:

installments;
payments;
reports;
customer summaries;
loan summaries.
39. Total Installment Obligation

A scheduled installment can be represented as:

total_due =
principal_due
+
interest_due
+
late_fee_due

However, late fees may be zero before an installment becomes eligible for a late fee.

Example:

Principal:
$100,000

Interest:
$20,000

Late fee:
$0

Total:
$120,000

Later:

Principal:
$100,000

Interest:
$20,000

Late fee:
$5,000

Total:
$125,000
40. Outstanding Installment Balance

The remaining installment balance must consider all unpaid components.

Conceptually:

Outstanding =
(principal_due - principal_paid)
+
(interest_due - interest_paid)
+
(late_fee_due - late_fee_paid)

The result must never be negative.

41. Loan Outstanding Balance

The loan's outstanding financial obligations are composed of:

Outstanding Principal
+
Outstanding Interest
+
Outstanding Late Fees

These values should be independently observable.

The system should not expose only one opaque "debt" number internally.

42. Loan Completion

A loan becomes:

PAID

when all required financial obligations have been settled.

Conceptually:

outstanding_principal = 0

and:

outstanding_interest = 0

and:

outstanding_late_fees = 0

The backend is responsible for determining this condition.

43. Loan Overdue Status

A loan becomes:

OVERDUE

when at least one installment is:

OVERDUE

and still has an outstanding balance.

If all overdue installments are fully paid and there are no other overdue installments, the loan should return to:

ACTIVE

provided it still has future obligations.

44. Loan Status Priority

When determining the loan status, the conceptual priority is:

CANCELLED
    ↓
PAID
    ↓
OVERDUE
    ↓
ACTIVE

However, cancelled loans must only become CANCELLED through an explicit valid operation.

The backend must not infer cancellation automatically.

45. Loan Creation

Creating a loan must validate:

customer exists;
customer belongs to authenticated user;
principal > 0;
interest rate is valid;
interest period exists;
amortization type is supported;
payment frequency is supported;
installment count is valid;
first due date is valid;
late-fee configuration is valid.

A loan must not be created with incomplete financial configuration.

46. Loan Immutability

Certain loan parameters become historically significant once installments or payments exist.

These include:

original principal
interest rate
interest period
amortization type
payment frequency
number of installments
first due date

Once a loan has received payments, changing these parameters should not silently regenerate the existing schedule.

Any modification must use an explicit restructuring mechanism if restructuring is introduced in a future version.

47. Loan Cancellation

Cancellation is a controlled operation.

A loan with no financial activity may be cancelled more easily.

A loan with payments or generated obligations must not simply be deleted.

Historical records must remain available.

If a loan must be cancelled after financial activity, the system should preserve:

original loan
installments
payments
cancellation event
48. Loan Deletion

Loans must not be physically deleted once they have financial activity.

The preferred approach is:

CANCELLED

rather than:

DELETE

This preserves financial history.

49. Schedule Generation

When a loan is created, the backend must generate its installment schedule.

The schedule should contain:

installment number
due date
principal
interest
total
remaining balance

The generated schedule becomes the basis for future payment tracking.

50. Schedule Determinism

Given identical inputs:

principal
interest rate
interest period
amortization type
payment frequency
number of installments
start date
first due date

the system must produce the same installment schedule.

This property is required for reliable testing.

51. Rounding

Financial calculations must use exact decimal arithmetic.

Rounding must be deterministic.

The system should avoid rounding intermediate calculations unnecessarily.

For example, in an amortization schedule:

Calculate using high precision
        ↓
Determine installment components
        ↓
Apply defined monetary rounding
        ↓
Store/display final monetary values

The final installment may require adjustment to eliminate residual differences.

52. Final Installment Adjustment

Due to monetary rounding, the sum of installment principal components may differ slightly from the original principal.

The system must correct the final installment.

Example:

Original principal:
$1,000,000

Calculated principal installments:
$999,999.99

The final installment must absorb the:

$0.01

difference.

The loan must ultimately reach:

outstanding_principal = 0

when fully paid.

53. Payment Allocation Responsibility

The loan engine determines the financial obligations.

The payment engine determines how received money is allocated.

Therefore:

Loan Rules
    ↓
Defines what is owed

Payment Rules
    ↓
Defines how money received is applied

Payment allocation must not be duplicated across different services.

See:

docs/business/PAYMENT_RULES.md
54. Loan Metrics

The system should calculate at least:

original_principal
outstanding_principal

scheduled_interest
outstanding_interest
collected_interest

scheduled_late_fees
outstanding_late_fees
collected_late_fees

total_scheduled
total_collected
total_outstanding

These metrics must be derived from authoritative financial records.

55. Customer Loan Summary

For each customer, PocketPal should be able to aggregate:

active loans
total principal lent
outstanding principal
total interest generated
interest collected
late fees
total receivable
total overdue

The aggregation must use the customer's loans and payment records.

56. Today's Collections

A collection is considered part of today's collection view when an installment:

is due today;
was previously due and remains outstanding;
or is otherwise classified as collectible today according to the collection rules.

Today's collection view should display:

customer
loan
installment
due date
expected amount
paid amount
remaining amount
days overdue
late fee
status
57. Upcoming Collections

Upcoming collections are installments whose due date is in the future and which still have an outstanding balance.

Example:

Due date:
2026-08-25

Today:
2026-08-21

Status:
UPCOMING

The application may group upcoming collections by date.

58. Overdue Collections

An overdue collection is an outstanding installment whose due date has passed.

The system should provide:

customer
loan
installment
due date
days overdue
principal outstanding
interest outstanding
late fee
total outstanding
59. Collection Totals

The collection module should calculate:

Expected
Collected
Pending
Overdue

These totals must be calculated from installment and payment data.

The frontend must not calculate collection totals independently and present them as authoritative.

60. Financial Invariants

The loan engine must always preserve these invariants.

Invariant 1
outstanding_principal >= 0
Invariant 2
outstanding_interest >= 0
Invariant 3
outstanding_late_fees >= 0
Invariant 4
paid_amount <= amount_due

unless an explicit overpayment policy exists.

Invariant 5

A paid installment must have:

outstanding_amount = 0
Invariant 6

A paid loan must have no outstanding financial obligations.

Invariant 7

A cancelled loan must remain historically accessible.

61. Example — Fixed Principal Loan

Loan:

Principal:
$1,000,000

Interest:
10% monthly

Installments:
10

Frequency:
Monthly

Amortization:
Fixed Principal

Principal per installment:

$100,000
Installment 1

Opening principal:

$1,000,000

Interest:

$100,000

Principal:

$100,000

Total:

$200,000

Remaining principal:

$900,000
Installment 2

Opening principal:

$900,000

Interest:

$90,000

Principal:

$100,000

Total:

$190,000

Remaining principal:

$800,000

The same process continues until:

outstanding_principal = 0
62. Example — Partial Payment

Installment:

Principal:
$100,000

Interest:
$20,000

Late fee:
$5,000

Total:
$125,000

Customer pays:

$80,000

The payment engine applies the amount according to:

docs/business/PAYMENT_RULES.md

The installment becomes:

PARTIAL

if a balance remains.

63. Example — Overdue Installment

Installment:

Due date:
2026-08-18

Current date:

2026-08-21

Outstanding amount:

$125,000

Therefore:

Days overdue = 3
Status = OVERDUE

If the configured grace period is:

5 days

the installment may still be overdue while not yet being eligible for a late fee, depending on the late-fee configuration.

This distinction is important:

OVERDUE
≠
LATE FEE APPLIED
64. Overdue vs Late Fee

An installment can be overdue without immediately having a late fee.

Example:

Due date:
August 18

Current date:
August 20

Grace period:
5 days

The installment is:

OVERDUE

but the late fee may remain:

$0

until the applicable grace period has elapsed.

65. Loan Calculation Engine

All loan calculations must be centralized in a dedicated backend calculation layer.

Conceptually:

backend/
└── app/
    └── calculators/
        ├── loan_calculator
        ├── interest_calculator
        ├── amortization_calculator
        ├── late_fee_calculator
        └── schedule_calculator

The exact implementation structure may evolve.

The important requirement is separation of financial calculation logic from:

API controllers;
database models;
frontend code.
66. Calculation Input

A loan calculator should receive a validated domain configuration containing the necessary values, such as:

principal
interest_rate
interest_period
amortization_type
payment_frequency
number_of_installments
start_date
first_due_date
late_fee_configuration

It must return deterministic financial results.

67. Calculation Output

The calculator should be capable of producing:

installment schedule
principal components
interest components
due dates
remaining balances

Late fees should be calculated separately when an installment becomes eligible.

68. Separation from Database

The financial calculator should not depend directly on database queries.

Preferred conceptual flow:

Database
   ↓
Domain data
   ↓
Calculator
   ↓
Financial result
   ↓
Persistence

This allows the financial engine to be tested independently.

69. Separation from Frontend

The frontend must never implement the authoritative loan calculation.

It may display:

estimated values

for user interaction if necessary.

However, the backend result is always authoritative.

70. Loan Rule Priority

When loan rules conflict, priority is:

Financial correctness.
Contracted loan configuration.
Historical consistency.
Deterministic calculation.
Auditability.
User experience.

The interface must never override a financial rule merely to make a workflow easier.

71. Future Loan Features

The following are intentionally outside the v1.0 loan engine:

refinancing;
loan restructuring;
renegotiated interest;
compound interest;
grace periods that modify principal;
automatic debt consolidation;
credit scoring;
external credit reporting;
collateral management;
co-borrowers;
guarantor liability;
variable interest rates.

These features may be evaluated in future versions.

72. Versioning

This document represents:

PocketPal Loan Rules v1.0

Any change that modifies how an existing loan is calculated must be treated as a business-critical change.

Existing historical loans must not silently change because of a new version of the calculation engine.

If calculation rules change in the future, the application must define how existing loans are migrated or preserved before implementation.

73. Final Principle

PocketPal must always be able to answer:

How much was originally lent?
How much principal remains?
How much interest was generated?
How much interest was collected?
How much late fee exists?
How much has been paid?
How much remains?
Why does the customer owe this amount?

If the system cannot reconstruct these values from its persisted financial records, the loan implementation is not considered reliable.


### Nota importante

Aquí ya estamos entrando en una parte **mucho más crítica** de PocketPal. Hay una decisión que dejé explícitamente separada: **qué pasa cuando un cliente paga una cantidad y cómo se distribuye entre mora → interés → capital**.

Eso **no lo voy a mezclar todavía** con `LOAN_RULES.md`, porque debe quedar completamente definido en:

**`docs/business/PAYMENT_RULES.md`**

Ahí vamos a definir cosas como:

- pago completo;
- pago parcial;
- qué se cobra primero;
- qué pasa si paga más de una cuota;
- qué pasa si paga menos;
- qué pasa si paga de más;
- cómo se registra la reversión de un pago;
- cómo se recalculan saldos;
- cómo se actualiza el préstamo;
- cómo se refleja el pago en Finanzas;
- cómo evitar doble contabilización.

Ese será probablemente uno de los documentos **más importantes de toda la aplicación**, porque es donde más fácil sería introducir errores financieros.