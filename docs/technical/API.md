# PocketPal — API Specification

**Version:** 1.0
**Status:** Official Technical Specification
**Domain:** REST API
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`

---

# 1. Purpose

This document defines the REST API contract for PocketPal.

The API is the communication layer between the React Native mobile application and the FastAPI backend.

It establishes:

* API conventions;
* authentication;
* endpoint organization;
* request and response structures;
* validation;
* error handling;
* pagination;
* filtering;
* financial operation requirements;
* idempotency;
* authorization;
* API versioning.

The API must expose business operations without moving financial calculation authority to the mobile application.

## The backend remains the authoritative source for financial results. This is consistent with the product specification and financial business rules.

# 2. API Responsibilities

The PocketPal API is responsible for:

1. Authenticating users.
2. Authorizing access to resources.
3. Validating requests.
4. Persisting domain data.
5. Executing business rules.
6. Performing financial calculations.
7. Generating loan schedules.
8. Allocating payments.
9. Updating installment and loan balances.
10. Returning consistent API responses.
11. Maintaining financial integrity.
12. Recording relevant audit events.

The API must not delegate authoritative financial calculations to the frontend.

---

# 3. Technology

The initial API implementation uses:

```text
Python
FastAPI
Pydantic
SQLAlchemy 2
Alembic
PostgreSQL
JWT
```

The backend project is conceptually organized as:

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

Financial calculation logic must remain isolated from API and persistence concerns.

---

# 4. API Base URL

The API must expose a versioned base path:

```text
/api/v1
```

Development example:

```text
http://localhost:8000/api/v1
```

Production URL configuration must be provided through environment configuration rather than hard-coded into the mobile application.

---

# 5. API Versioning

PocketPal uses URL-based versioning.

Initial version:

```text
/api/v1
```

Example:

```http
GET /api/v1/loans
```

A breaking API change should result in a new major API version:

```text
/api/v2
```

Backward-compatible additions may remain within the existing version.

---

# 6. HTTP Methods

The API follows standard HTTP semantics.

| Method   | Purpose                                      |
| -------- | -------------------------------------------- |
| `GET`    | Retrieve resources                           |
| `POST`   | Create resources or execute operations       |
| `PUT`    | Replace a resource                           |
| `PATCH`  | Partially update a resource                  |
| `DELETE` | Remove/deactivate a resource where permitted |

Financial records should generally not be physically deleted.

Where historical integrity is required, the API should expose explicit cancellation or reversal operations instead.

---

# 7. Content Type

Requests containing JSON data must use:

```http
Content-Type: application/json
```

Responses are returned as:

```http
Content-Type: application/json
```

Unless an endpoint explicitly documents another representation.

---

# 8. Authentication

PocketPal uses JWT-based authentication.

Authenticated requests must provide:

```http
Authorization: Bearer <access_token>
```

Example:

```http
Authorization: Bearer eyJhbGciOi...
```

Protected endpoints must reject requests without a valid authentication token.

---

# 9. Authentication Endpoints

## 9.1 Register

```http
POST /api/v1/auth/register
```

Creates a new PocketPal user.

### Request

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "full_name": "John Doe"
}
```

### Response

```http
201 Created
```

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "token_type": "bearer"
}
```

---

# 10. Login

```http
POST /api/v1/auth/login
```

Authenticates a user.

### Request

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

### Response

```http
200 OK
```

```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "token_type": "bearer"
}
```

Invalid credentials must return:

```http
401 Unauthorized
```

---

# 11. Refresh Token

```http
POST /api/v1/auth/refresh
```

Generates a new access token using a valid refresh token.

### Request

```json
{
  "refresh_token": "refresh-token"
}
```

### Response

```json
{
  "access_token": "new-jwt-token",
  "token_type": "bearer"
}
```

---

# 12. Logout

```http
POST /api/v1/auth/logout
```

Invalidates the relevant refresh session/token where server-side token management is implemented.

### Response

```http
204 No Content
```

---

# 13. Current User

```http
GET /api/v1/auth/me
```

Returns the authenticated user.

### Response

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2026-08-21T20:00:00Z"
}
```

---

# 14. Health Check

```http
GET /api/v1/health
```

Used to verify that the API is operational.

### Response

```http
200 OK
```

```json
{
  "status": "ok"
}
```

The endpoint must not expose secrets, credentials or infrastructure-sensitive information.

---

# 15. Resource Ownership

Every user-owned resource must be associated with the authenticated user.

Examples include:

```text
Transaction
Category
FinancialGoal
Client
Loan
LoanPayment
AuditLog
```

The API must derive ownership from the authenticated user rather than trusting a client-supplied `user_id`.

Incorrect:

```json
{
  "user_id": "another-user-id"
}
```

The API must not allow the client to use such a field to access another user's resources.

---

# 16. Personal Finance API

The personal finance API manages:

* categories;
* income;
* expenses;
* transactions;
* financial goals;
* goal contributions;
* financial summaries.

---

# 17. Categories

## List Categories

```http
GET /api/v1/categories
```

### Query Parameters

```text
type
is_active
```

Example:

```http
GET /api/v1/categories?type=EXPENSE&is_active=true
```

---

## Create Category

```http
POST /api/v1/categories
```

### Request

```json
{
  "name": "Transportation",
  "type": "EXPENSE"
}
```

### Response

```http
201 Created
```

```json
{
  "id": "uuid",
  "name": "Transportation",
  "type": "EXPENSE",
  "is_active": true,
  "created_at": "2026-08-21T20:00:00Z"
}
```

---

## Update Category

```http
PATCH /api/v1/categories/{category_id}
```

### Request

```json
{
  "name": "Transport"
}
```

---

## Deactivate Category

```http
POST /api/v1/categories/{category_id}/deactivate
```

Categories with historical transactions should be deactivated rather than physically deleted.

---

# 18. Transactions

The transaction API represents personal income and expenses.

Supported types:

```text
INCOME
EXPENSE
```

Amounts must be positive decimal values. The transaction type determines the financial direction.

---

## List Transactions

```http
GET /api/v1/transactions
```

### Query Parameters

```text
type
category_id
start_date
end_date
status
page
page_size
```

Example:

```http
GET /api/v1/transactions?type=EXPENSE&start_date=2026-08-01&end_date=2026-08-31
```

---

## Get Transaction

```http
GET /api/v1/transactions/{transaction_id}
```

---

## Create Transaction

```http
POST /api/v1/transactions
```

### Request

```json
{
  "type": "EXPENSE",
  "amount": "85000.00",
  "category_id": "uuid",
  "transaction_date": "2026-08-21",
  "description": "Groceries",
  "payment_method": "CASH",
  "notes": "Weekly shopping"
}
```

### Response

```http
201 Created
```

```json
{
  "id": "uuid",
  "type": "EXPENSE",
  "amount": "85000.00",
  "category_id": "uuid",
  "transaction_date": "2026-08-21",
  "description": "Groceries",
  "payment_method": "CASH",
  "status": "ACTIVE",
  "created_at": "2026-08-21T20:00:00Z"
}
```

---

# 19. Update Transaction

```http
PATCH /api/v1/transactions/{transaction_id}
```

Only permitted fields may be changed.

The API must preserve historical traceability.

---

# 20. Cancel Transaction

```http
POST /api/v1/transactions/{transaction_id}/cancel
```

The transaction remains stored but no longer participates in active balance calculations.

### Response

```json
{
  "id": "uuid",
  "status": "CANCELLED"
}
```

Physical deletion of financial transactions should be avoided.

---

# 21. Financial Summary

```http
GET /api/v1/finance/summary
```

### Query Parameters

```text
start_date
end_date
```

### Response

```json
{
  "currency": "COP",
  "total_income": "3000000.00",
  "total_expenses": "1200000.00",
  "balance": "1800000.00"
}
```

The balance is derived from valid transactions:

```text
Balance = Total Income - Total Expenses
```

---

# 22. Financial Goals

## List Goals

```http
GET /api/v1/goals
```

---

## Get Goal

```http
GET /api/v1/goals/{goal_id}
```

---

## Create Goal

```http
POST /api/v1/goals
```

### Request

```json
{
  "name": "Buy a computer",
  "target_amount": "5000000.00",
  "target_date": "2027-06-30",
  "description": "Savings goal for a new computer"
}
```

---

## Update Goal

```http
PATCH /api/v1/goals/{goal_id}
```

---

## Cancel Goal

```http
POST /api/v1/goals/{goal_id}/cancel
```

---

# 23. Goal Contributions

## List Contributions

```http
GET /api/v1/goals/{goal_id}/contributions
```

---

## Create Contribution

```http
POST /api/v1/goals/{goal_id}/contributions
```

### Request

```json
{
  "amount": "250000.00",
  "date": "2026-08-21",
  "description": "Monthly savings"
}
```

The contribution amount must be positive.

The goal's accumulated amount should be derived from valid contributions.

---

## Reverse Contribution

```http
POST /api/v1/goals/{goal_id}/contributions/{contribution_id}/reverse
```

The original contribution must remain historically traceable.

---

# 24. Customer API

Customers are represented by the `Client` domain entity.

The product specification uses the concept of customers for people receiving loans.

---

# 25. List Customers

```http
GET /api/v1/clients
```

### Query Parameters

```text
search
status
page
page_size
```

Example:

```http
GET /api/v1/clients?search=Juan&page=1&page_size=20
```

---

# 26. Create Customer

```http
POST /api/v1/clients
```

### Request

```json
{
  "full_name": "Juan Pérez",
  "document_number": "123456789",
  "phone": "3001234567",
  "alternative_phone": null,
  "email": "juan@example.com",
  "address": "Medellín",
  "notes": "Customer since 2026"
}
```

---

# 27. Get Customer

```http
GET /api/v1/clients/{client_id}
```

The response should provide basic customer information.

---

# 28. Update Customer

```http
PATCH /api/v1/clients/{client_id}
```

---

# 29. Customer Summary

```http
GET /api/v1/clients/{client_id}/summary
```

### Response

```json
{
  "client_id": "uuid",
  "active_loans": 2,
  "total_capital_lent": "3000000.00",
  "outstanding_capital": "1800000.00",
  "total_receivable": "2200000.00",
  "total_overdue": "350000.00"
}
```

The summary must be calculated by the backend from the customer's loan and payment data.

---

# 30. Customer References

## List References

```http
GET /api/v1/clients/{client_id}/references
```

---

## Create Reference

```http
POST /api/v1/clients/{client_id}/references
```

### Request

```json
{
  "name": "María Pérez",
  "phone": "3011234567",
  "address": "Medellín",
  "relationship": "Sister",
  "notes": ""
}
```

References are informational and are not an external credit verification mechanism.

---

## Update Reference

```http
PATCH /api/v1/clients/{client_id}/references/{reference_id}
```

---

## Delete/Deactivate Reference

```http
POST /api/v1/clients/{client_id}/references/{reference_id}/deactivate
```

---

# 31. Loan API

Loans are one of the principal domains of PocketPal.

A loan contains:

```text
client
principal
start date
interest rate
interest period
amortization type
payment frequency
installment count
first due date
late fee configuration
guarantee
notes
status
```

---

# 32. List Loans

```http
GET /api/v1/loans
```

### Query Parameters

```text
status
client_id
start_date
end_date
page
page_size
```

Example:

```http
GET /api/v1/loans?status=ACTIVE&page=1&page_size=20
```

---

# 33. Get Loan

```http
GET /api/v1/loans/{loan_id}
```

The response should include the current loan summary.

Example:

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "principal": "1000000.00",
  "outstanding_principal": "700000.00",
  "interest_rate": "10.00",
  "interest_period": "MONTHLY",
  "amortization_type": "FIXED_PRINCIPAL",
  "payment_frequency": "MONTHLY",
  "number_of_installments": 10,
  "status": "ACTIVE"
}
```

---

# 34. Create Loan

```http
POST /api/v1/loans
```

### Request

```json
{
  "client_id": "uuid",
  "principal": "1000000.00",
  "start_date": "2026-08-21",
  "interest_rate": "10.00",
  "interest_period": "MONTHLY",
  "amortization_type": "FIXED_PRINCIPAL",
  "payment_frequency": "MONTHLY",
  "number_of_installments": 10,
  "first_due_date": "2026-09-21",
  "late_fee_configuration": {
    "enabled": true,
    "type": "FIXED_AMOUNT",
    "value": "10000.00",
    "grace_period_days": 2
  },
  "guarantee": null,
  "notes": ""
}
```

The backend must validate the complete configuration before creating the loan.

---

# 35. Loan Creation Process

Creating a loan is a financial operation.

The backend should execute the operation conceptually as:

```text
Validate request
       ↓
Validate client ownership
       ↓
Validate loan parameters
       ↓
Calculate schedule
       ↓
Validate schedule
       ↓
Persist loan
       ↓
Persist installments
       ↓
Record audit event
       ↓
Return loan
```

The mobile application must not generate the authoritative installment schedule.

---

# 36. Loan Schedule

```http
GET /api/v1/loans/{loan_id}/schedule
```

Returns the generated installment schedule.

### Response

```json
{
  "loan_id": "uuid",
  "installments": [
    {
      "id": "uuid",
      "installment_number": 1,
      "due_date": "2026-09-21",
      "principal_due": "100000.00",
      "interest_due": "100000.00",
      "late_fee_due": "0.00",
      "total_due": "200000.00",
      "principal_paid": "0.00",
      "interest_paid": "0.00",
      "late_fee_paid": "0.00",
      "remaining_balance": "900000.00",
      "status": "PENDING"
    }
  ]
}
```

The exact interest and amortization calculations are defined by the loan business rules.

---

# 37. Regenerate Loan Schedule

Schedule regeneration must not be an unrestricted generic update.

If a loan already has payments or other financial history, changing fundamental loan parameters may be prohibited or require an explicit restructuring operation.

The API must never silently modify historical installment calculations.

---

# 38. Loan Status

Supported initial statuses:

```text
ACTIVE
PAID
OVERDUE
CANCELLED
```

The backend determines status from the loan's financial state.

The frontend must not manually mark an active loan as paid.

---

# 39. Installments

## List Installments

```http
GET /api/v1/loans/{loan_id}/installments
```

### Query Parameters

```text
status
start_date
end_date
page
page_size
```

---

## Get Installment

```http
GET /api/v1/loans/{loan_id}/installments/{installment_id}
```

---

# 40. Installment Status

Supported statuses:

```text
PENDING
PARTIAL
PAID
OVERDUE
CANCELLED
```

The backend is responsible for determining the status.

The frontend must display the server-provided status rather than independently calculating it.

---

# 41. Payments

A payment represents money received from a customer.

The API must preserve the original payment record.

---

# 42. Register Payment

```http
POST /api/v1/loans/{loan_id}/payments
```

### Request

```json
{
  "amount": "80000.00",
  "payment_date": "2026-08-21",
  "payment_method": "CASH",
  "notes": "Customer paid in cash"
}
```

The backend must:

1. Validate the loan.
2. Validate the authenticated user owns the loan.
3. Validate the amount.
4. Determine outstanding obligations.
5. Calculate applicable late fees.
6. Allocate the payment.
7. Update installment balances.
8. Update loan balances.
9. Generate the appropriate financial effects.
10. Record the operation in the audit trail.

Payment allocation rules belong to:

```text
docs/business/PAYMENT_RULES.md
```

---

# 43. Payment Response

Example:

```json
{
  "id": "uuid",
  "loan_id": "uuid",
  "client_id": "uuid",
  "amount": "80000.00",
  "payment_date": "2026-08-21",
  "payment_method": "CASH",
  "allocation": {
    "late_fee": "5000.00",
    "interest": "20000.00",
    "principal": "55000.00"
  },
  "created_at": "2026-08-21T20:00:00Z"
}
```

The allocation must be calculated by the backend.

---

# 44. Payment History

```http
GET /api/v1/loans/{loan_id}/payments
```

### Query Parameters

```text
start_date
end_date
page
page_size
```

---

# 45. Payment Detail

```http
GET /api/v1/loans/{loan_id}/payments/{payment_id}
```

The response should include:

* payment information;
* allocation;
* affected installments;
* timestamps.

---

# 46. Payment Reversal

```http
POST /api/v1/loans/{loan_id}/payments/{payment_id}/reverse
```

A payment reversal is preferred over physical deletion.

The API must preserve:

```text
Original payment
Reversal operation
Affected balances
Audit history
```

A reversal must be treated as a financial operation requiring transaction integrity.

---

# 47. Idempotency

Financial mutation endpoints should support idempotency.

This is particularly important for:

```text
POST /payments
POST /payment reversal
POST /loans
```

The client should provide:

```http
Idempotency-Key: <unique-operation-key>
```

Example:

```http
Idempotency-Key: 01J8...
```

If the same operation is retried using the same key, the backend must not create a duplicate financial operation.

---

# 48. Payment Transaction Integrity

Payment registration must be atomic.

Conceptually:

```text
BEGIN TRANSACTION

Create payment
        ↓
Allocate payment
        ↓
Update installment balances
        ↓
Update loan state
        ↓
Create financial effects
        ↓
Create audit event

COMMIT
```

If any required operation fails:

```text
ROLLBACK
```

No partial financial state should remain.

---

# 49. Today's Collections

```http
GET /api/v1/collections/today
```

Returns obligations relevant to the current date.

### Response

```json
{
  "date": "2026-08-21",
  "summary": {
    "expected_today": "500000.00",
    "collected_today": "250000.00",
    "pending_today": "250000.00",
    "overdue": "150000.00"
  },
  "items": []
}
```

The current date must be determined using the user's configured timezone.

---

# 50. Collections

```http
GET /api/v1/collections
```

### Query Parameters

```text
filter
start_date
end_date
client_id
loan_id
status
page
page_size
```

Supported conceptual filters:

```text
TODAY
THIS_WEEK
THIS_MONTH
OVERDUE
UPCOMING
ALL
```

The product specification explicitly requires today's and general collections.

---

# 51. Dashboard API

The dashboard should avoid forcing the mobile application to make many independent requests when a consolidated endpoint is appropriate.

---

## Main Dashboard

```http
GET /api/v1/dashboard
```

### Response

```json
{
  "finance": {
    "balance": "1800000.00",
    "monthly_income": "3000000.00",
    "monthly_expenses": "1200000.00"
  },
  "loans": {
    "total_capital_lent": "5000000.00",
    "outstanding_capital": "3000000.00",
    "generated_interest": "800000.00",
    "collected_interest": "600000.00",
    "today_collections": "350000.00",
    "total_receivable": "4200000.00",
    "total_overdue": "500000.00"
  },
  "goals": []
}
```

The endpoint provides an aggregated read model.

It must not duplicate or independently redefine financial business rules.

---

# 52. Reports API

Initial reporting endpoints may include:

```http
GET /api/v1/reports/finance
GET /api/v1/reports/loans
GET /api/v1/reports/collections
```

Reports should support:

```text
start_date
end_date
```

Additional filters may be introduced as required.

---

# 53. Finance Report

```http
GET /api/v1/reports/finance
```

Example response:

```json
{
  "period": {
    "start_date": "2026-08-01",
    "end_date": "2026-08-31"
  },
  "income": "3000000.00",
  "expenses": "1200000.00",
  "balance": "1800000.00",
  "by_category": []
}
```

---

# 54. Loan Report

```http
GET /api/v1/reports/loans
```

Example:

```json
{
  "period": {
    "start_date": "2026-08-01",
    "end_date": "2026-08-31"
  },
  "capital_lent": "5000000.00",
  "principal_recovered": "2000000.00",
  "interest_received": "500000.00",
  "late_fees_received": "75000.00",
  "outstanding_capital": "3000000.00"
}
```

Principal recovery must remain distinct from interest income.

---

# 55. Pagination

List endpoints should support pagination.

Standard parameters:

```text
page
page_size
```

Example:

```http
GET /api/v1/clients?page=2&page_size=20
```

Default:

```text
page = 1
page_size = 20
```

The API should enforce a maximum page size.

Recommended initial maximum:

```text
100
```

---

# 56. Paginated Response

A standard paginated response should use:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 125,
    "total_pages": 7
  }
}
```

---

# 57. Filtering

Filtering must use query parameters.

Example:

```http
GET /api/v1/loans?status=ACTIVE
```

Multiple filters may be combined:

```http
GET /api/v1/loans?status=ACTIVE&client_id=uuid&page=1
```

The backend must validate supported filter values.

---

# 58. Sorting

List endpoints may support:

```text
sort
order
```

Example:

```http
GET /api/v1/loans?sort=start_date&order=desc
```

Only explicitly supported fields may be used for sorting.

The API must not directly interpolate arbitrary client input into SQL.

---

# 59. Date Filtering

Date-only financial filters use:

```text
YYYY-MM-DD
```

Example:

```text
2026-08-21
```

Datetime fields use ISO 8601.

Example:

```text
2026-08-21T20:00:00Z
```

---

# 60. Decimal Representation

Monetary values should be serialized as strings.

Recommended:

```json
{
  "amount": "100000.00"
}
```

rather than:

```json
{
  "amount": 100000.00
}
```

This avoids loss of precision when values pass between backend, JSON and JavaScript/TypeScript.

The database and backend must continue using exact decimal arithmetic.

---

# 61. Enum Values

API enums should use stable machine-readable values.

Example:

```text
INCOME
EXPENSE
```

rather than localized labels.

The mobile application is responsible for translating enum values into user-facing labels.

---

# 62. Validation

All incoming requests must be validated on the backend.

Validation must cover:

* required fields;
* data types;
* decimal values;
* dates;
* enum values;
* string lengths;
* identifiers;
* ownership;
* domain constraints.

Example:

```text
amount > 0
```

is required for normal financial transactions.

---

# 63. Validation Error

Invalid requests should return:

```http
422 Unprocessable Entity
```

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than zero."
      }
    ]
  }
}
```

---

# 64. Error Response Standard

All API errors should follow a consistent structure.

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message.",
    "details": []
  }
}
```

The `code` is intended for application logic.

The `message` is intended for debugging and controlled user feedback.

The mobile application should not depend exclusively on the textual message.

---

# 65. HTTP Status Codes

PocketPal should use standard HTTP status codes.

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| `200`  | Successful request                         |
| `201`  | Resource created                           |
| `204`  | Successful operation without response body |
| `400`  | Invalid request                            |
| `401`  | Authentication required/invalid            |
| `403`  | Authenticated but not authorized           |
| `404`  | Resource not found                         |
| `409`  | Conflict                                   |
| `422`  | Validation error                           |
| `429`  | Too many requests                          |
| `500`  | Internal server error                      |
| `503`  | Service unavailable                        |

---

# 66. Not Found

When a resource does not exist or is inaccessible to the authenticated user:

```http
404 Not Found
```

Example:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found.",
    "details": []
  }
}
```

The API should avoid revealing whether another user's resource exists.

---

# 67. Authorization Errors

If a user is authenticated but attempts an operation they are not allowed to perform:

```http
403 Forbidden
```

Example:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to perform this operation.",
    "details": []
  }
}
```

---

# 68. Conflict Errors

Use:

```http
409 Conflict
```

for domain conflicts such as:

* duplicate active operation;
* invalid state transition;
* repeated idempotency key with conflicting payload;
* attempting to perform an operation incompatible with current financial state.

Example:

```json
{
  "error": {
    "code": "INVALID_STATE",
    "message": "The loan cannot be modified in its current state.",
    "details": []
  }
}
```

---

# 69. Financial Error Codes

Initial financial error codes may include:

```text
INVALID_PAYMENT_AMOUNT
PAYMENT_EXCEEDS_ALLOWED_AMOUNT
LOAN_ALREADY_PAID
LOAN_CANCELLED
INSTALLMENT_ALREADY_PAID
INVALID_INSTALLMENT_STATE
INVALID_LOAN_CONFIGURATION
NEGATIVE_OUTSTANDING_BALANCE
PAYMENT_ALREADY_REVERSED
DUPLICATE_FINANCIAL_OPERATION
```

The exact error catalog may expand as business rules are formalized.

---

# 70. State Transitions

The API must enforce valid financial state transitions.

Example installment lifecycle:

```text
PENDING
   │
   ├── payment ──> PARTIAL
   │                  │
   │                  └── payment ──> PAID
   │
   └── due date ──> OVERDUE
                       │
                       ├── partial payment ──> PARTIAL
                       └── full payment ──> PAID
```

Invalid transitions must be rejected.

The frontend must never directly force an arbitrary status.

---

# 71. Financial Calculations

The API is the authoritative calculation layer.

The backend calculates:

* interest;
* amortization;
* installment values;
* outstanding principal;
* late fees;
* payment allocation;
* loan status;
* collection status;
* financial summaries.

The frontend only sends the required inputs and displays the returned results.

This follows the product requirement that financial calculations be performed by the backend.

---

# 72. Loan Calculator Separation

Financial calculators should not depend directly on HTTP request objects.

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

Example:

```text
POST /loans
     ↓
LoanService
     ↓
AmortizationCalculator
     ↓
Schedule
```

This makes the financial engine independently testable.

---

# 73. Payment Allocation Separation

Payment allocation must be isolated from the HTTP layer.

Conceptually:

```text
POST /loans/{id}/payments
            ↓
      PaymentService
            ↓
    PaymentAllocator
            ↓
     AllocationResult
            ↓
 Database transaction
```

The allocation algorithm belongs to the payment business rules.

---

# 74. Audit Events

Relevant API operations should generate audit events.

Examples:

```text
USER_REGISTERED
LOAN_CREATED
LOAN_CANCELLED
PAYMENT_CREATED
PAYMENT_REVERSED
TRANSACTION_CREATED
TRANSACTION_CANCELLED
GOAL_CONTRIBUTION_CREATED
GOAL_CONTRIBUTION_REVERSED
```

Audit events should contain sufficient information to reconstruct what happened.

---

# 75. Audit Endpoint

Audit logs should not necessarily be exposed as a generic unrestricted endpoint.

If administrative/audit visibility is introduced, it must be explicitly authorized.

A possible future endpoint is:

```http
GET /api/v1/audit-logs
```

This is not required for the initial mobile product.

---

# 76. Database Transactions

Financial mutation endpoints must use database transactions where multiple records are modified as one logical operation.

Examples:

```text
Create loan + installments
Register payment + allocation + balances
Reverse payment + restore balances
Create/reverse financial effects
```

The operation must either succeed completely or fail completely.

---

# 77. Concurrency

The backend must protect financial operations against concurrent modifications.

Particular attention is required when:

* two payments are registered simultaneously;
* a payment is reversed while another payment is being processed;
* a loan is modified while a payment is being registered.

The implementation should use appropriate database transaction isolation and/or row locking.

The exact strategy belongs to the architecture implementation.

---

# 78. API Security

The API must enforce:

* JWT authentication;
* authorization;
* user-level data isolation;
* server-side validation;
* secure password hashing;
* secret management;
* protected database access;
* rate limiting where appropriate.

Passwords must never be stored in plaintext.

Secrets must never be committed to source control.

Detailed security requirements belong to:

```text
docs/technical/SECURITY.md
```

---

# 79. OpenAPI

FastAPI should automatically expose OpenAPI documentation during development.

Expected endpoints:

```text
/docs
/redoc
/openapi.json
```

Production exposure of interactive API documentation should be explicitly configured according to the security policy.

---

# 80. API Documentation Requirements

Every endpoint should document:

* HTTP method;
* URL;
* authentication requirements;
* path parameters;
* query parameters;
* request body;
* response body;
* possible status codes;
* validation rules;
* business constraints.

FastAPI/Pydantic schemas should be the primary source for generated API documentation.

---

# 81. Naming Conventions

Endpoints should use plural resource names.

Preferred:

```text
/clients
/loans
/installments
/payments
/categories
/transactions
/goals
```

Avoid inconsistent singular naming such as:

```text
/client
/loan
```

Actions that represent domain operations may use explicit subpaths:

```text
/loans/{id}/cancel
/payments/{id}/reverse
/categories/{id}/deactivate
```

---

# 82. JSON Naming Convention

The API should use:

```text
snake_case
```

for JSON fields.

Example:

```json
{
  "client_id": "uuid",
  "payment_date": "2026-08-21",
  "outstanding_principal": "700000.00"
}
```

The React Native application may transform these values internally if its coding conventions require it.

---

# 83. Resource Identifiers

Resources should use UUID identifiers.

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

IDs must be generated by the backend.

Clients should not be able to choose arbitrary resource IDs.

---

# 84. API Request Flow

A standard authenticated request follows:

```text
React Native
     │
     │ HTTPS
     ▼
FastAPI Router
     │
     ▼
Authentication
     │
     ▼
Authorization
     │
     ▼
Pydantic Validation
     │
     ▼
Service Layer
     │
     ├───────────────┐
     ▼               ▼
Repository      Calculator
     │               │
     └───────┬───────┘
             ▼
         PostgreSQL
             │
             ▼
        API Response
```

---

# 85. Read vs Mutation Endpoints

Read endpoints should retrieve already persisted or calculated views.

Mutation endpoints must invoke domain services.

The API router should not contain complex financial calculations.

Avoid:

```python
@router.post("/payments")
def create_payment(...):
    # hundreds of lines of financial calculations
```

Prefer:

```text
Router
  ↓
PaymentService
  ↓
PaymentAllocator
  ↓
Repository
```

---

# 86. API and Business Rules

The API must implement, expose or consume the business rules defined in:

```text
docs/business/FINANCIAL_RULES.md
docs/business/LOAN_RULES.md
docs/business/PAYMENT_RULES.md
```

The API specification does not replace those documents.

Responsibilities are:

```text
API.md
    ↓
How clients communicate with the backend

FINANCIAL_RULES.md
    ↓
How personal financial data behaves

LOAN_RULES.md
    ↓
How loans and interest behave

PAYMENT_RULES.md
    ↓
How payments are allocated and reversed
```

---

# 87. Frontend Responsibilities

The mobile application is responsible for:

* collecting user input;
* presenting forms;
* basic client-side validation;
* displaying API errors;
* displaying loading states;
* displaying financial results;
* requesting operations;
* refreshing stale data.

The mobile application is not responsible for authoritative:

* interest calculations;
* late-fee calculations;
* payment allocation;
* loan status calculation;
* outstanding balance calculation.

---

# 88. Caching

The mobile application may cache read responses using the selected client-side data management strategy.

However:

```text
Cached financial data
≠
Authoritative financial state
```

After financial mutations, relevant queries must be invalidated or refreshed.

Examples:

```text
Create payment
    ↓
Invalidate:
    loan
    installments
    payments
    collections
    dashboard
    financial summaries
```

---

# 89. Offline Behavior

Offline-first financial mutation is not required for v1.0.

The application should avoid pretending that a financial operation succeeded when the backend has not confirmed it.

A payment should only be considered registered after receiving successful server confirmation.

---

# 90. API Testing

The API must be tested at multiple levels.

## Unit Tests

Test:

* validators;
* services;
* calculators;
* payment allocation;
* business rules.

## Integration Tests

Test:

* API + PostgreSQL;
* authentication;
* repositories;
* financial transactions.

## API Tests

Test:

* HTTP status codes;
* request validation;
* authorization;
* response schemas;
* state transitions.

## Financial Scenarios

At minimum:

```text
Full payment
Partial payment
Multiple-installment payment
Overdue payment
Late fee
Payment reversal
Loan completion
Duplicate payment request
Concurrent payment attempts
```

The product specification explicitly requires automated testing for the financial engine.

---

# 91. Example End-to-End Payment Flow

A complete payment request:

```http
POST /api/v1/loans/loan-uuid/payments
Authorization: Bearer <token>
Idempotency-Key: payment-operation-001
Content-Type: application/json
```

Request:

```json
{
  "amount": "80000.00",
  "payment_date": "2026-08-21",
  "payment_method": "CASH",
  "notes": "Payment received"
}
```

Backend:

```text
Authenticate
    ↓
Authorize loan
    ↓
Validate amount
    ↓
Lock relevant financial records
    ↓
Determine outstanding obligations
    ↓
Calculate late fees
    ↓
Allocate payment
    ↓
Update installments
    ↓
Update loan
    ↓
Create financial effects
    ↓
Create audit record
    ↓
Commit
```

Response:

```http
201 Created
```

```json
{
  "id": "payment-uuid",
  "amount": "80000.00",
  "allocation": {
    "late_fee": "5000.00",
    "interest": "20000.00",
    "principal": "55000.00"
  }
}
```

---

# 92. API Integrity Rules

The following rules are mandatory:

1. Never trust financial calculations supplied by the client.
2. Never trust a client-supplied `user_id` for authorization.
3. Never allow negative monetary amounts where prohibited.
4. Never silently delete financial history.
5. Never apply the same payment twice because of a retry.
6. Never allow outstanding principal to become negative.
7. Never mark an installment as paid without a valid financial operation.
8. Never modify historical financial calculations silently.
9. Never return floating-point monetary values where precision may be lost.
10. Never commit a partial financial mutation.
11. Never allow users to access another user's financial data.
12. Never expose secrets through API responses.
13. Never place complex financial logic directly inside API routers.
14. Never allow the frontend to be the source of truth for financial state.

---

# 93. Initial Endpoint Map

```text
/api/v1
│
├── /health
│
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   ├── POST /logout
│   └── GET  /me
│
├── /categories
│   ├── GET    /
│   ├── POST   /
│   ├── PATCH  /{id}
│   └── POST   /{id}/deactivate
│
├── /transactions
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── PATCH  /{id}
│   └── POST   /{id}/cancel
│
├── /finance
│   └── GET /summary
│
├── /goals
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── PATCH  /{id}
│   ├── POST   /{id}/cancel
│   └── /{id}/contributions
│
├── /clients
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── PATCH  /{id}
│   ├── GET    /{id}/summary
│   └── /{id}/references
│
├── /loans
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── GET    /{id}/schedule
│   ├── GET    /{id}/installments
│   ├── GET    /{id}/payments
│   └── POST   /{id}/payments
│
├── /collections
│   ├── GET /today
│   └── GET /
│
├── /dashboard
│   └── GET /
│
└── /reports
    ├── GET /finance
    ├── GET /loans
    └── GET /collections
```

---

# 94. Definition of Done for API Endpoints

An endpoint is considered complete when:

* authentication requirements are defined;
* authorization is implemented;
* request schema is defined;
* response schema is defined;
* validation is implemented;
* business rules are enforced;
* error responses are documented;
* database operations are tested;
* financial operations are atomic where required;
* idempotency is implemented where required;
* OpenAPI documentation is generated;
* relevant audit events are implemented;
* integration tests pass;
* frontend integration is verified.

---

# 95. Relationship with Technical Documentation

The API specification is part of the technical documentation set:

```text
docs/
│
├── technical/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   └── SECURITY.md
```

The responsibilities are:

```text
ARCHITECTURE.md
    → System structure and technical architecture

DATABASE.md
    → Persistence model and database design

API.md
    → Backend communication contract

SECURITY.md
    → Security architecture and controls
```

These documents must remain consistent.

---

# 96. Versioning

This document represents:

```text
PocketPal API Specification v1.0
```

Changes that break existing API consumers require an explicit API version change.

Changes to financial behavior must also update the corresponding business-rule documentation.

API behavior must never silently diverge from the documented financial rules.
