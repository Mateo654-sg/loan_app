# PocketPal — Security

**Version:** 1.0
**Status:** Official Technical Security Specification
**Domain:** Application Security
**Parent specification:** `docs/PRODUCT_SPECIFICATION.md`

---

# 1. Purpose

This document defines the security requirements and security architecture for PocketPal.

PocketPal manages sensitive personal and financial information, including:

* user accounts;
* personal income and expenses;
* financial goals;
* customer information;
* customer references;
* loans;
* installments;
* payments;
* interest;
* late fees;
* financial history;
* audit records.

The security model must therefore prioritize:

1. Authentication.
2. Authorization.
3. User-level data isolation.
4. Financial data integrity.
5. Credential protection.
6. Secret management.
7. API security.
8. Auditability.
9. Input validation.
10. Protection against accidental or malicious data modification.

The product specification explicitly requires JWT authentication, password hashing, protected endpoints, server-side validation, user-level data isolation, environment variables and secret management.

---

# 2. Security Principles

PocketPal follows these principles:

## 2.1 Least Privilege

Every user, service and application component must have only the permissions required to perform its function.

A user must not automatically receive access to another user's financial data.

---

## 2.2 Backend as Security and Financial Authority

The backend is responsible for:

* authentication;
* authorization;
* validation;
* financial calculations;
* payment allocation;
* ownership verification;
* financial state transitions.

The frontend must never be considered a trusted security boundary.

Client-side validation improves user experience but does not replace backend validation.

---

## 2.3 User Data Isolation

Every user-owned domain entity must be associated with the authenticated user.

Examples include:

```text
Transaction
Category
FinancialGoal
Client
Loan
LoanInstallment
LoanPayment
AuditLog
```

The backend must verify ownership before returning, modifying or deleting any user-owned resource.

---

## 2.4 Secure by Default

New endpoints, entities and features should be private by default.

An endpoint should only be public when its public behavior is explicitly required.

Examples of potentially public endpoints:

```text
POST /auth/register
POST /auth/login
```

Protected application endpoints must require valid authentication.

---

## 2.5 Fail Securely

Security failures must not expose sensitive information.

For example, authentication failures should not reveal whether:

* an email exists;
* a password was almost correct;
* another user owns a requested resource.

---

# 3. Security Boundaries

The initial architecture contains two principal application components:

```text
React Native Mobile Application
            │
            │ HTTPS
            ▼
       FastAPI Backend
            │
            ▼
        PostgreSQL
```

Security boundaries exist between:

```text
Mobile application → API
API → Database
User → User-owned resources
Authentication → Authorization
Application → External services
```

The backend must not trust information supplied by the mobile application when that information can be derived securely from the authenticated session.

---

# 4. Authentication

PocketPal uses token-based authentication.

The initial authentication strategy is:

```text
JWT
```

Authentication is responsible for determining:

```text
Who is the user?
```

Authorization is responsible for determining:

```text
What is the user allowed to access?
```

These concerns must remain separate.

---

# 5. Registration

User registration must validate:

* email;
* password;
* required profile information;
* duplicate account constraints.

The backend must normalize and validate the email before creating the account.

Passwords must never be stored directly.

---

# 6. Password Security

Passwords must never be stored in plaintext.

The backend must store only a secure password hash.

The implementation should use a modern password hashing algorithm appropriate for password storage.

Recommended approach:

```text
Argon2id
```

If another algorithm is used, it must provide appropriate resistance against offline password cracking.

Passwords must never appear in:

* logs;
* API responses;
* database records in plaintext;
* audit metadata;
* error messages.

---

# 7. Password Requirements

The password policy must enforce a reasonable minimum password strength.

The exact complexity requirements should be centralized rather than duplicated across endpoints.

The backend should reject obviously invalid passwords such as empty or extremely short values.

The application should avoid unnecessarily restrictive composition rules that encourage predictable passwords.

---

# 8. JWT Authentication

PocketPal uses JWTs for authenticated API access.

A token should contain only the information necessary to identify and authorize the session.

Conceptually:

```text
sub = user_id
```

Sensitive financial information must never be embedded inside a JWT.

The backend should validate:

* token signature;
* token expiration;
* token type where applicable;
* required claims;
* token structure.

---

# 9. Access and Refresh Tokens

The authentication system may use:

```text
Access Token
Refresh Token
```

The access token should have a relatively short lifetime.

The refresh mechanism must provide a controlled way to obtain a new access token without requiring the user to enter credentials repeatedly.

Refresh-token handling must support revocation or invalidation when required.

---

# 10. Token Storage

The mobile application must not store authentication tokens in ordinary unprotected application storage when secure platform storage is available.

React Native should use platform-provided secure storage mechanisms.

The implementation should protect tokens against unnecessary exposure to:

* application logs;
* debugging output;
* accidental serialization;
* insecure local persistence.

---

# 11. Logout

Logout must invalidate the local authenticated session.

If refresh tokens are persisted server-side or tracked for revocation, logout should invalidate the corresponding refresh mechanism.

The application must remove locally stored authentication credentials after logout.

---

# 12. Authorization

Every protected request must be evaluated against the authenticated user.

Authorization must verify:

```text
authenticated user
        ↓
resource ownership
        ↓
requested action
```

Authentication alone is not sufficient.

A valid token must not allow access to arbitrary resources.

---

# 13. Object-Level Authorization

Endpoints receiving resource identifiers must verify ownership.

Example:

```text
GET /loans/{loan_id}
```

The backend must verify that:

```text
loan.user_id == authenticated_user.id
```

or that ownership can be established through a trusted relationship.

The API must never rely solely on:

```text
loan_id
```

as proof of authorization.

---

# 14. User Isolation

A user must only be able to access their own:

```text
Transactions
Categories
Goals
Goal Contributions
Clients
Client References
Loans
Installments
Payments
Reports
Audit Records
```

Queries must include the authenticated user's ownership constraints where appropriate.

Example conceptual query:

```text
SELECT *
FROM loans
WHERE id = :loan_id
AND user_id = :current_user_id;
```

The exact database implementation belongs to:

```text
docs/technical/DATABASE.md
```

---

# 15. Indirect Ownership

Some entities may not contain a direct `user_id`.

For example:

```text
LoanInstallment
```

may belong to:

```text
Loan
```

which belongs to:

```text
User
```

Authorization must follow the ownership relationship.

Conceptually:

```text
User
  │
  └── Loan
        │
        └── LoanInstallment
```

A user may access the installment only if the associated loan belongs to that user.

---

# 16. API Security

All production API traffic must use:

```text
HTTPS
```

Plain HTTP must not be used for sensitive authenticated communication in production.

The API must reject or redirect insecure transport according to the deployment architecture.

---

# 17. CORS

Cross-Origin Resource Sharing must be explicitly configured.

The backend must not use unrestricted production configuration such as:

```text
allow_origins = ["*"]
```

for authenticated application traffic unless there is a documented reason and the security implications are understood.

Only required origins should be allowed.

---

# 18. Request Validation

All externally supplied data must be validated on the backend.

FastAPI/Pydantic schemas should validate:

* types;
* required fields;
* string lengths;
* numeric ranges;
* dates;
* enumerations;
* identifiers;
* monetary values.

Validation must occur before business logic is executed.

---

# 19. Monetary Input Validation

Financial amounts must satisfy the business rules defined in:

```text
docs/business/FINANCIAL_RULES.md
```

For normal financial transactions:

```text
amount > 0
```

must be enforced.

The backend must reject malformed monetary values.

Floating-point values must not be used for financial calculations.

---

# 20. Financial State Validation

The backend must validate financial state transitions.

Examples:

```text
PAID → PENDING
```

must not happen silently.

Similarly:

```text
outstanding_principal < 0
```

must never be accepted as a valid financial state.

The backend must enforce the business rules before persisting financial changes.

---

# 21. Payment Security

Payments are high-integrity financial operations.

Payment registration must:

1. Authenticate the user.
2. Verify loan ownership.
3. Validate the payment amount.
4. Validate the payment date.
5. Validate the payment state.
6. Allocate the payment according to business rules.
7. Update the affected balances atomically.
8. Preserve payment history.
9. Create an audit record where required.

Payment rules are defined in:

```text
docs/business/PAYMENT_RULES.md
```

---

# 22. Idempotency

Important financial operations should be designed to prevent accidental duplicate execution.

This is particularly important for:

```text
payment registration
```

A network retry must not accidentally register the same payment twice.

Where appropriate, the API should support an idempotency key.

Conceptually:

```text
Idempotency-Key: <unique-operation-id>
```

The backend must detect repeated requests representing the same operation.

---

# 23. Database Transactions

Financial operations that modify multiple related records must execute atomically.

For example, registering a payment may modify:

```text
LoanPayment
LoanInstallment
Loan
Personal financial records
AuditLog
```

These operations should be performed inside an appropriate database transaction.

If one required operation fails, the complete financial operation should be rolled back.

---

# 24. Concurrency Control

Financial operations must account for concurrent requests.

Example:

Two requests attempt to register a payment against the same installment at approximately the same time.

The system must prevent:

```text
double allocation
negative balance
duplicate payment
inconsistent installment status
```

Appropriate database locking, transaction isolation or optimistic concurrency mechanisms should be used.

The exact implementation belongs to the architecture and database documentation.

---

# 25. SQL Injection Protection

The backend must never construct SQL queries by directly concatenating untrusted input.

SQLAlchemy parameterization must be used for database operations.

User input must never become executable SQL.

Example of prohibited conceptual behavior:

```text
"SELECT * FROM users WHERE email = '" + email + "'"
```

Queries must use parameterized mechanisms provided by the database layer.

---

# 26. Authentication Endpoint Protection

Authentication endpoints should include protections against automated abuse.

Possible controls include:

* rate limiting;
* login attempt throttling;
* temporary account protection;
* request monitoring.

The exact thresholds should be configurable.

---

# 27. Rate Limiting

Rate limiting should be applied to sensitive endpoints.

Priority endpoints include:

```text
POST /auth/login
POST /auth/register
POST /auth/refresh
POST /payments
```

Rate limits must not interfere with legitimate normal use.

The implementation should be centralized rather than duplicated across controllers.

---

# 28. Error Handling

Production errors must not expose:

* database connection strings;
* SQL statements;
* stack traces;
* internal filesystem paths;
* environment variables;
* JWT secrets;
* password hashes;
* internal service credentials.

The API should return safe error responses.

Conceptual response:

```json
{
  "detail": "An unexpected error occurred."
}
```

Detailed diagnostic information should remain in protected server-side logs.

---

# 29. Resource Enumeration Protection

Resource identifiers should not be treated as authorization credentials.

The API must prevent users from discovering another user's resources through sequential identifiers or predictable URLs.

For example, changing:

```text
/loans/100
```

to:

```text
/loans/101
```

must not reveal another user's loan.

Authorization checks must occur independently of identifier predictability.

---

# 30. Sensitive Data Exposure

PocketPal must minimize the amount of sensitive information returned by API endpoints.

Responses should contain only the information required by the requesting feature.

Sensitive internal fields should not be exposed unnecessarily.

Examples of information requiring protection include:

* password hashes;
* authentication secrets;
* internal database identifiers where unnecessary;
* security metadata;
* internal system configuration.

---

# 31. Customer Data Protection

Customer information is sensitive application data.

The backend must protect:

* names;
* identification numbers;
* phone numbers;
* email addresses;
* addresses;
* references;
* notes.

Customer information must only be accessible to the authenticated PocketPal user who owns the corresponding customer relationship.

---

# 32. Financial Data Protection

Financial data requires stronger integrity controls than ordinary application metadata.

The system must preserve:

* transaction history;
* loan history;
* payment history;
* installment history;
* financial calculations;
* audit records.

Financial records must not be silently removed or rewritten.

---

# 33. Audit Logging

PocketPal should maintain audit records for security-sensitive and financially important operations.

Potential actions include:

```text
LOGIN
LOGOUT
CREATE_LOAN
UPDATE_LOAN
CANCEL_LOAN
CREATE_PAYMENT
REVERSE_PAYMENT
UPDATE_TRANSACTION
CANCEL_TRANSACTION
CREATE_USER
```

An audit record should conceptually contain:

```text
id
user_id
action
entity_type
entity_id
timestamp
metadata
```

Audit metadata must not contain plaintext passwords, secrets or authentication tokens.

---

# 34. Audit Log Integrity

Audit logs must be append-oriented.

Normal application functionality must not allow users to arbitrarily modify historical audit records.

Audit records should remain available for security and financial investigation.

---

# 35. Secrets Management

Secrets must never be hard-coded into source code.

Examples:

```text
DATABASE_URL
JWT_SECRET
JWT_PRIVATE_KEY
API_KEYS
PASSWORDS
ENCRYPTION_KEYS
```

must be supplied through secure environment configuration or a dedicated secret-management system.

---

# 36. Environment Variables

Development configuration may use:

```text
.env
```

but `.env` files containing secrets must never be committed to source control.

The repository should contain a safe template such as:

```text
.env.example
```

containing placeholders rather than real credentials.

Example:

```text
DATABASE_URL=
JWT_SECRET=
```

---

# 37. Secret Rotation

Security-sensitive credentials should support rotation.

The architecture should allow:

* JWT secret rotation;
* database credential rotation;
* external API key rotation;
* service credential rotation.

Rotating a secret must not require source-code modification.

---

# 38. Repository Security

The repository must never contain:

```text
.env
private keys
database passwords
JWT secrets
API tokens
production credentials
```

Developers should use secret-scanning tools where appropriate.

Secrets accidentally committed to version control must be considered compromised and rotated.

---

# 39. Dependency Security

Project dependencies must be maintained regularly.

The project should:

* avoid unnecessary dependencies;
* remove unused dependencies;
* monitor known vulnerabilities;
* update security-sensitive dependencies;
* lock dependency versions appropriately.

Security updates should be evaluated before deployment.

---

# 40. Docker Security

Containers must follow least-privilege principles.

Production containers should avoid unnecessary privileges.

Where practical:

* do not run applications as root;
* expose only required ports;
* avoid unnecessary Linux capabilities;
* use minimal base images;
* keep images updated;
* do not include secrets inside images.

---

# 41. Database Security

PostgreSQL must not be exposed directly to the public internet in production.

The database should be accessible only by trusted backend services.

Database credentials must be stored securely.

Application database users should have only the permissions required by the application.

---

# 42. Database Backups

Financial data must be backed up regularly.

Backups should be protected using:

* access controls;
* encryption where appropriate;
* secure storage;
* retention policies.

Backup access must be restricted.

A backup containing customer and financial information must be treated as sensitive data.

---

# 43. Backup Recovery

Backups are only useful if they can be restored.

The project should periodically test:

```text
backup creation
backup integrity
database restoration
application compatibility
```

Recovery procedures should be documented before production use.

---

# 44. Data Encryption

Sensitive data must be protected in transit using HTTPS/TLS.

Data at rest should rely on appropriate infrastructure and database/storage encryption where available.

Particularly sensitive credentials must never be stored using reversible plaintext encoding.

Encryption keys must be managed separately from encrypted data.

---

# 45. Personal Data Minimization

PocketPal should only collect customer and user information required by the product.

The application should avoid collecting unnecessary sensitive information.

For example, customer notes should not become a mechanism for storing passwords, authentication credentials or unrelated sensitive information.

---

# 46. Logging Security

Application logs must not contain:

```text
passwords
JWT tokens
refresh tokens
database passwords
API keys
full authentication credentials
```

Financial and personal information should be logged only when necessary for debugging, auditing or operational purposes.

Logs should use appropriate access controls.

---

# 47. Mobile Application Security

The React Native application must treat all client-side data as potentially accessible to the device environment.

The mobile application must not be considered a trusted place for:

* financial business rules;
* authorization decisions;
* secret API credentials;
* authoritative balances.

The backend remains the source of truth.

---

# 48. API Client Security

The mobile client should:

* use HTTPS;
* securely store authentication credentials;
* avoid logging tokens;
* handle expired access tokens;
* clear authentication state after logout;
* avoid exposing sensitive API responses unnecessarily.

Network errors must not reveal internal backend details to the user.

---

# 49. Authorization on the Mobile Client

The mobile application may hide UI elements based on authentication state, but this is not a security mechanism.

For example:

```text
Hide Delete Button
```

does not provide authorization.

The backend must independently validate whether the operation is allowed.

---

# 50. Input Sanitization

User-provided text should be handled safely.

Potentially unsafe input includes:

* names;
* descriptions;
* notes;
* customer information;
* search queries.

The backend must validate lengths and formats where applicable.

If user-controlled content is rendered in a context where injection is possible, the appropriate output-encoding mechanism must be used.

---

# 51. File and Attachment Security

File uploads are not part of the initial PocketPal v1.0 scope.

If attachments are introduced later, they must receive a separate security design covering:

* file type validation;
* file size limits;
* malware scanning;
* storage permissions;
* filename handling;
* download authorization;
* access expiration where appropriate.

---

# 52. Session Security

Sessions must have controlled lifetimes.

The application should invalidate authentication credentials when appropriate, including:

* logout;
* token expiration;
* credential compromise;
* account security events.

Refresh-token mechanisms should support invalidation where required.

---

# 53. Account Security

Future account-security features may include:

* password change;
* account recovery;
* session management;
* device/session revocation;
* suspicious login detection.

These features are not all required for v1.0 but the authentication architecture should not prevent their future implementation.

---

# 54. Account Recovery

Password recovery must never reveal whether a specific email address belongs to a registered account.

Recovery tokens should:

* expire;
* be single-use;
* be unpredictable;
* never appear in application logs;
* be invalidated after successful use.

---

# 55. Financial Operation Authorization

High-impact operations should require authenticated ownership and valid business state.

Examples:

```text
Create Loan
Cancel Loan
Register Payment
Reverse Payment
Modify Financial Transaction
Cancel Financial Transaction
```

The backend must validate both:

```text
Authorization
+
Business Rules
```

before applying the operation.

---

# 56. Payment Reversal Security

A payment reversal must not physically erase the original payment.

The system should create an explicit reversal or adjustment record.

Conceptually:

```text
Original Payment
       ↓
Reversal
       ↓
Updated Financial State
```

This maintains historical traceability.

---

# 57. Security and Financial Integrity

Security in PocketPal is not limited to preventing unauthorized access.

It also includes preventing unauthorized or inconsistent financial modifications.

The following must therefore be considered security violations:

* unauthorized payment modification;
* unauthorized loan modification;
* cross-user financial access;
* duplicate payment processing;
* manipulation of outstanding balances;
* deletion of financial history;
* bypassing backend financial rules.

---

# 58. Security Headers

The production API should use appropriate HTTP security headers where applicable.

The final set depends on the deployment architecture, but should consider protections such as:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Strict-Transport-Security
```

Only headers applicable to the API and deployment environment should be enabled.

---

# 59. API Documentation Security

The development environment may expose interactive API documentation.

Production access to API documentation should be evaluated carefully.

If public exposure is not required, administrative or internal documentation endpoints should be restricted.

Sensitive example credentials must never appear in API documentation.

---

# 60. Development vs Production

Security configuration must distinguish between:

```text
Development
Testing
Production
```

Development environments may use relaxed settings for debugging, but production must not inherit insecure development defaults.

Examples of production requirements:

```text
DEBUG = false
HTTPS = enabled
real secrets = externalized
database = private
logs = controlled
CORS = restricted
```

---

# 61. Security Configuration

Security-sensitive configuration should be centralized.

Conceptually:

```text
backend/app/core/
```

may contain configuration and security-related modules.

Security configuration must not be duplicated throughout controllers and services.

---

# 62. Security Testing

Security testing must cover at least:

## Authentication

* invalid credentials;
* expired tokens;
* invalid tokens;
* missing tokens;
* refresh behavior;
* logout behavior.

## Authorization

* accessing another user's transaction;
* accessing another user's loan;
* accessing another user's customer;
* modifying another user's payment;
* accessing nested resources belonging to another user.

## Input validation

* invalid monetary values;
* malformed dates;
* oversized strings;
* invalid enumerations;
* invalid identifiers.

## Financial integrity

* duplicate payments;
* concurrent payments;
* negative balances;
* unauthorized state changes.

---

# 63. Security Test Examples

A request such as:

```text
GET /loans/{another_user_loan_id}
```

must not return the other user's loan.

A request such as:

```text
POST /loans/{another_user_loan_id}/payments
```

must be rejected.

A request attempting to create:

```text
amount = -100000
```

must be rejected.

A repeated payment request with the same idempotency key must not create two payments.

---

# 64. Security Incident Handling

If a security incident occurs, the affected credentials and access paths must be evaluated immediately.

Potential actions include:

* revoke affected sessions;
* rotate secrets;
* disable compromised credentials;
* investigate audit records;
* verify financial integrity;
* restore from a trusted backup if necessary;
* patch the vulnerability;
* document the incident.

Financial discrepancies caused by a security incident must be investigated separately from ordinary application errors.

---

# 65. Security Monitoring

Production environments should monitor:

* repeated authentication failures;
* abnormal request rates;
* unauthorized-access attempts;
* repeated payment failures;
* suspicious resource access;
* server errors;
* database failures.

Monitoring data must itself be protected.

---

# 66. Security Review Checklist

Before production release:

* [ ] Authentication is implemented securely.
* [ ] Passwords are hashed.
* [ ] JWT secrets are externalized.
* [ ] HTTPS is enabled.
* [ ] Protected endpoints require authentication.
* [ ] Object-level authorization is enforced.
* [ ] User data isolation has been tested.
* [ ] SQL injection protections are in place.
* [ ] Backend validation is implemented.
* [ ] Financial calculations occur on the backend.
* [ ] Payment operations are atomic.
* [ ] Duplicate payment protection exists.
* [ ] Concurrency controls have been tested.
* [ ] Sensitive information is excluded from logs.
* [ ] Production CORS is restricted.
* [ ] Database access is private.
* [ ] Database credentials are protected.
* [ ] Backups are configured.
* [ ] Backup restoration has been tested.
* [ ] Dependencies have been reviewed.
* [ ] Secrets have been scanned.
* [ ] Security tests pass.
* [ ] Audit logging is implemented for critical operations.
* [ ] Production debugging is disabled.
* [ ] Security configuration is documented.

---

# 67. Security Requirements by Priority

## Critical

The following are mandatory:

```text
Authentication
Authorization
User data isolation
Password hashing
HTTPS
Secret protection
Backend validation
Financial operation integrity
Database transaction integrity
Payment duplicate protection
```

## High

The following should be implemented before production:

```text
Rate limiting
Audit logging
Secure token storage
Database backups
Dependency vulnerability management
Security monitoring
Concurrency protection
```

## Medium

The following can be progressively strengthened:

```text
Advanced session management
Device management
Suspicious login detection
Advanced security monitoring
Automated security scanning
```

---

# 68. Relationship with Other Technical Documents

Security requirements interact with several project documents.

```text
PRODUCT_SPECIFICATION.md
        │
        ├── Defines product scope
        │
        ▼
ARCHITECTURE.md
        │
        ├── Defines system boundaries
        │
        ▼
DATABASE.md
        │
        ├── Defines persistence and ownership
        │
        ▼
API.md
        │
        ├── Defines endpoints and authentication
        │
        ▼
SECURITY.md
        │
        └── Defines security requirements
```

Security requirements must be considered when designing:

* database relationships;
* API endpoints;
* authentication;
* financial services;
* payment processing;
* mobile storage.

---

# 69. Security and Business Rules

Security controls must not contradict financial business rules.

The business rule documents define:

```text
docs/business/FINANCIAL_RULES.md
docs/business/LOAN_RULES.md
docs/business/PAYMENT_RULES.md
```

Security defines how those rules are protected from unauthorized access or modification.

For example:

```text
PAYMENT_RULES.md
        ↓
Defines how a payment is allocated

SECURITY.md
        ↓
Defines who can register that payment
and how the operation is protected
```

---

# 70. Definition of Done — Security

A security-sensitive feature is complete only when:

* authentication requirements are defined;
* authorization requirements are defined;
* ownership checks are implemented;
* backend validation is implemented;
* sensitive information is protected;
* financial state transitions are validated;
* database operations are atomic where required;
* audit requirements are satisfied;
* relevant security tests pass;
* secrets are not embedded in source code;
* error responses do not expose internal information;
* documentation reflects the implemented behavior.

---

# 71. Current Security Status

PocketPal is currently in the planning and specification stage.

The minimum security foundation required before production includes:

```text
JWT authentication
Password hashing
Protected API endpoints
User-level data isolation
Backend validation
Secure secret management
HTTPS
Financial operation integrity
Auditability
Database protection
```

The implementation must be aligned with:

```text
docs/technical/ARCHITECTURE.md
docs/technical/DATABASE.md
docs/technical/API.md
```

and the business rules defined in:

```text
docs/business/FINANCIAL_RULES.md
docs/business/LOAN_RULES.md
docs/business/PAYMENT_RULES.md
```

---

# 72. Versioning

This document represents:

```text
PocketPal Security Specification v1.0
```

Security requirements must not be weakened silently.

Any architectural change that affects authentication, authorization, financial integrity, secret management or user data isolation requires an explicit update to this document.

Security-critical changes should also include appropriate migration and testing procedures.

---

# 73. Final Security Principle

PocketPal handles financial records, not merely generic application data.

Therefore:

> **No user interface action, API request or external client should ever be trusted to determine financial authority or ownership.**

The backend must authenticate the user, verify authorization, validate the requested operation, apply the applicable business rules, preserve financial history and persist the result atomically.

The security architecture must protect both:

```text
Confidentiality
+
Integrity
```

while maintaining the traceability required for a financial management system.
