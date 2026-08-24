# PocketPal — UI/UX Specification

**Version:** 1.0  
**Status:** Official Product Specification  
**Product:** PocketPal  
**Related documents:**
- `docs/PRODUCT_SPECIFICATION.md`
- `docs/business/FINANCIAL_RULES.md`
- `docs/business/LOAN_RULES.md`
- `docs/business/PAYMENT_RULES.md`
- `docs/design/DESIGN_SYSTEM.md`

---

# 1. Purpose

This document defines the user experience and interface structure of PocketPal.

It describes:

- application navigation;
- main screens;
- user flows;
- dashboard structure;
- personal finance workflows;
- customer management;
- loan management;
- payment management;
- collections;
- goals;
- reports;
- forms;
- responsive behavior;
- interaction patterns.

The purpose is to ensure that PocketPal is not only visually consistent, but also easy and efficient to use.

---

# 2. UX Philosophy

PocketPal is designed for users who need to manage two closely related financial activities:

```text
Personal finances
+
Lending management

The user should be able to perform common financial operations with as few unnecessary steps as possible.

3. Primary User

PocketPal v1.0 is primarily designed for an individual who:

manages personal income and expenses;
creates financial goals;
lends money to other people;
tracks customers;
manages loans;
receives payments;
monitors overdue installments;
needs a simple view of their financial situation.

The interface should therefore be optimized for an individual operator rather than a large enterprise.

4. Main Product Areas

PocketPal is divided into two primary areas.

Personal Finance
Dashboard
Transactions
Categories
Goals
Lending
Customers
Loans
Payments
Collections

Additional areas may include:

Reports
Settings
Profile
5. Primary Navigation

The main navigation should expose the most important areas without overwhelming the user.

Recommended structure:

PocketPal

Dashboard

PERSONAL FINANCE
  Transactions
  Categories
  Goals

LENDING
  Customers
  Loans
  Collections
  Payments

REPORTS

Settings

The navigation structure may be adapted for mobile.

6. Dashboard

The dashboard is the primary landing page after authentication.

Its purpose is to answer:

How are my finances doing?

What happened recently?

How much money do I have?

How much am I owed?

What do I need to collect today?

Who is overdue?

The dashboard must prioritize actionable financial information.

7. Dashboard Structure

Recommended structure:

┌─────────────────────────────────────────────┐
│ Header                                      │
│ Good morning, Mateo                         │
│                                             │
│ [Primary action]                            │
├─────────────────────────────────────────────┤
│                                             │
│ Financial Metrics                           │
│                                             │
│ Balance | Income | Expenses | Loans         │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ Cash Flow             │ Collections         │
│                       │                     │
├───────────────────────┴─────────────────────┤
│                                             │
│ Recent Transactions                          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ Loans / Overdue Summary                     │
│                                             │
└─────────────────────────────────────────────┘

The exact visual styling belongs to:

docs/design/DESIGN_SYSTEM.md
8. Dashboard Metrics

The dashboard should expose the most useful high-level metrics.

Recommended metrics:

Current balance
Total income
Total expenses
Outstanding loans
Today's collections
Overdue amount

Additional metrics may be introduced when supported by actual business requirements.

9. Dashboard Metric Behavior

Every metric card should contain:

Label
Value
Optional contextual information
Optional trend

Example:

Outstanding loans

$4,250,000

3 active loans

The user should be able to click a metric when a relevant detailed screen exists.

Example:

Overdue amount
       ↓
Collections filtered by overdue
10. Quick Actions

The dashboard should provide quick access to frequent actions.

Recommended actions:

+ Add income
+ Add expense
+ New customer
+ New loan
Register payment

The most frequent actions should require minimal navigation.

11. Recent Activity

The dashboard should display recent financial activity.

Possible entries:

Income
Expense
Loan created
Payment received
Goal contribution

Each entry should show:

Type
Description
Date
Amount

Example:

Payment received
Juan Pérez
Today
+$150,000
12. Dashboard Collection Summary

The dashboard should provide a concise collection overview.

Example:

Today's collections

Expected       $500,000
Collected      $350,000
Pending        $150,000

The user should be able to navigate to the detailed collections screen.

13. Dashboard Overdue Summary

When overdue obligations exist, the dashboard should make them visible.

Example:

Overdue

3 customers
5 installments
$420,000

The user should be able to navigate directly to the overdue collection view.

14. Transactions Screen

The transactions screen manages personal financial movements.

It should allow users to:

View transactions
Create transaction
Edit transaction
Filter transactions
Search transactions
View transaction details

Transaction types:

Income
Expense

Transfers may be supported if defined in the financial rules.

15. Transaction List

Recommended structure:

Transactions

[Search] [Filter] [+ Add transaction]

Date       Description       Category       Amount
---------------------------------------------------
Aug 21     Salary            Income         +$2,000,000
Aug 20     Food              Food           -$35,000
Aug 19     Transport         Transport      -$20,000

The amount should use semantic financial styling.

16. Transaction Creation

The user should be able to create an income or expense from one unified workflow.

Recommended fields:

Type
Amount
Category
Date
Description
Notes

The form should clearly indicate whether the transaction is:

Income

or:

Expense
17. Transaction Form UX

The form should follow a logical order:

1. Transaction type
2. Amount
3. Category
4. Date
5. Description
6. Notes
7. Save

The amount should receive strong visual emphasis.

18. Categories

The categories screen allows users to manage categories used by personal transactions.

The system should provide common default categories.

Examples of expense categories:

Food
Transport
Housing
Utilities
Entertainment
Health
Education
Shopping
Other

Examples of income categories:

Salary
Freelance
Business
Investment
Loan interest
Other

Default categories should be practical and simple.

19. Category UX

The category list should show:

Category name
Type
Number of transactions
Optional total

Users should be able to:

Create
Edit
Deactivate

categories where appropriate.

20. Goals Screen

Goals allow users to define financial objectives.

Example:

Emergency fund
New PC
Trip
Education
Vehicle

A goal should communicate:

Goal name
Target amount
Current amount
Progress
Target date

Example:

New PC

$2,500,000 / $4,000,000

████████████░░░░░

62.5%
21. Goal Creation

Recommended fields:

Goal name
Target amount
Target date
Initial contribution
Description

The user should be able to create a goal quickly.

22. Goal Detail

Goal detail should show:

Target
Current amount
Remaining amount
Progress percentage
Target date
Contribution history

Primary action:

+ Add contribution
23. Customers Screen

The Customers screen is the central entry point for lending management.

It should allow users to:

View customers
Search customers
Create customer
Edit customer
View customer details
View customer loans
View payment history
24. Customer List

Recommended structure:

Customers

[Search customers] [+ New customer]

Customer       Active loans       Outstanding       Status
------------------------------------------------------------
Juan Pérez           2             $850,000         ACTIVE
María López          1             $300,000         OVERDUE
Carlos Gómez         0                  $0           PAID

The exact columns may change based on screen width.

25. Customer Creation

Customer creation should be intentionally simple.

Recommended fields:

Full name
Phone
Email
Identification
Address
Notes

Only required information should be mandatory.

The application should avoid collecting unnecessary personal information.

26. Customer Detail

The customer detail screen should provide a complete overview.

Recommended structure:

Customer
├── Personal information
├── Financial summary
├── Active loans
├── Overdue obligations
├── Payment history
└── Actions
27. Customer Financial Summary

The customer detail screen should display:

Active loans
Total borrowed
Total paid
Outstanding balance
Overdue amount

These values must be calculated from authoritative backend data.

28. Customer Actions

Recommended actions:

Edit customer
New loan
Register payment
View loans
View payment history
Deactivate customer

The most common action should be visually prioritized.

29. Loan Creation Flow

The loan creation flow should be one of the most important workflows in PocketPal.

Recommended sequence:

Select customer
       ↓
Enter loan amount
       ↓
Configure interest
       ↓
Configure payment schedule
       ↓
Review loan
       ↓
Create loan
30. Loan Creation — Step 1

The first step identifies the customer.

The user may:

Search existing customer

or:

Create new customer

without unnecessarily leaving the loan workflow.

31. Loan Creation — Step 2

The user enters the financial configuration.

Required/possible fields:

Principal amount
Interest rate
Interest type
Loan date
First payment date
Number of installments
Payment frequency

Only fields supported by the official loan rules should be presented.

32. Loan Creation — Step 3

The application should preview the resulting loan before creation.

Example:

Loan summary

Principal             $1,000,000
Interest rate              5%
Installments                  10
Frequency                  Weekly

Estimated installment     $110,000
Total payable            $1,100,000

The exact calculation must come from the backend.

33. Loan Confirmation

Before creating the loan, the user should be able to verify:

Customer
Principal
Interest
Installments
Frequency
First payment date
Total payable

Primary action:

Create loan

Secondary action:

Back
34. Loan Detail Screen

Loan detail is one of the most important screens in the application.

Recommended structure:

Loan #001

Customer
Status

┌─────────────────────────────────┐
│ Outstanding balance             │
│ $850,000                        │
└─────────────────────────────────┘

Principal     $800,000
Interest       $40,000
Late fees      $10,000

[Register payment]

Installments
Payment history
Loan information
35. Loan Header

The loan header should immediately communicate:

Customer
Loan identifier
Loan status
Principal
Outstanding amount

If overdue, the overdue state must be immediately visible.

36. Loan Balance

The loan balance should be separated into:

Principal
Interest
Late fees
Total outstanding

Example:

Principal       $800,000
Interest         $40,000
Late fees        $10,000
-------------------------
Total            $850,000

This prevents the user from confusing principal with total debt.

37. Installment Schedule

The loan detail screen should provide an installment schedule.

Recommended columns:

# 
Due date
Amount
Principal
Interest
Late fee
Paid
Remaining
Status

On smaller screens, these may become expandable cards.

38. Installment Status

The UI must clearly distinguish:

PENDING
DUE
OVERDUE
PARTIAL
PAID

The visual representation must follow:

docs/design/DESIGN_SYSTEM.md
39. Payment Registration Flow

Registering a payment must be one of the fastest workflows in PocketPal.

Recommended flow:

Register payment
       ↓
Select loan/customer
       ↓
Enter amount
       ↓
Select date
       ↓
Select payment method
       ↓
Review allocation
       ↓
Confirm
40. Payment Registration Form

Recommended fields:

Customer / Loan
Payment amount
Payment date
Payment method
Reference
Notes

The user may optionally select a specific installment if supported.

41. Payment Allocation Preview

Before final confirmation, the application should show the expected allocation.

Example:

Payment

Amount:
$250,000

Allocation

Late fees       $10,000
Interest        $40,000
Principal      $200,000

Remaining loan balance:
$800,000

The allocation must be calculated by the backend.

42. Payment Confirmation

The user should clearly understand the financial effect before confirming.

Primary action:

Register payment

Secondary action:

Cancel

If the payment generates an overpayment/credit, the interface must explicitly inform the user.

43. Payment Success

After registration, show a clear confirmation.

Example:

Payment registered successfully.

$250,000 received.

Late fees       $10,000
Interest        $40,000
Principal      $200,000

Remaining balance:
$800,000

The user should be able to:

View payment
View loan
Register another payment
44. Payment History

Payment history should be available from:

Loan
Customer
Payments

Each payment should show:

Date
Amount
Principal
Interest
Late fees
Method
Status
45. Payment Detail

Payment detail should show the complete allocation.

Example:

Payment #00031

Customer:
Juan Pérez

Loan:
Loan #001

Date:
August 21, 2026

Amount:
$250,000

Allocation:
Principal     $200,000
Interest       $40,000
Late fees      $10,000

Status:
POSTED
46. Payment Reversal UX

Payment reversal is a destructive financial action.

The user must receive a clear confirmation dialog.

Example:

Reverse payment?

Payment:
$250,000

This action will restore the financial
effects of this payment.

[Cancel] [Reverse payment]

A reversal reason should be required.

47. Collections Screen

Collections is designed for daily lending operations.

The purpose is to answer:

Who should pay today?

Who has already paid?

Who is overdue?

How much should I collect?

How much have I collected?
48. Collections Dashboard

Recommended top-level metrics:

Due today
Collected today
Pending today
Overdue

Example:

Today's collections

Expected       $800,000
Collected      $550,000
Pending        $250,000
Overdue        $420,000
49. Collections Filters

The collections screen should support:

Today
Upcoming
Overdue
Paid

Additional filters may include:

Customer
Loan
Date range
Amount
50. Today's Collections

Today's collection list should prioritize actionable information.

Recommended columns:

Customer
Loan
Due amount
Paid
Remaining
Due date
Status
Action

Example:

Juan Pérez
Loan #001
$100,000
$50,000
$50,000
Today
PARTIAL

[Register payment]
51. Overdue Collections

The overdue view should prioritize urgency.

Example:

OVERDUE

Customer       Days overdue    Amount       Action
-----------------------------------------------------
María López        8           $120,000      Collect
Carlos Gómez       3            $80,000      Collect

The exact number of days must be calculated from authoritative dates.

52. Collection Actions

From a collection record, the user should be able to:

Register payment
View loan
View customer

The payment action should be prominent.

53. Search and Filters

Large lists must provide search and filtering.

Search should be available for:

Customers
Loans
Payments
Transactions

Filters should be context-specific.

54. Search UX

Search inputs should use clear placeholders.

Example:

Search customers by name or phone...

Avoid:

Search...

when a more specific description improves usability.

55. Loading UX

During API requests:

Buttons → loading state
Lists → skeleton
Metrics → skeleton

The application should prevent duplicate submissions while a financial operation is being processed.

56. Form Submission

When a financial form is submitted:

Button disabled
Loading indicator
Request sent
Response received
Success/error shown

The user must not be able to accidentally create duplicate financial records through repeated clicks.

57. Empty States

Every major list needs a meaningful empty state.

Example:

No customers yet.

Create your first customer to start managing loans.

[+ New customer]

Another:

No overdue payments.

Great! You are up to date.

Empty states should be informative and context-aware.

58. Error UX

Errors must explain:

What happened
What the user can do

Example:

We couldn't register this payment.

The loan may have changed since you opened this screen.

Refresh the loan and try again.

Avoid exposing technical implementation details.

59. Confirmation UX

Confirmation should be required when an operation:

deletes information;
reverses a payment;
cancels a loan;
performs another irreversible or financially significant action.

Normal operations such as viewing details should not require confirmation.

60. Navigation Between Related Entities

PocketPal should make related information easy to access.

Example:

Customer
   ↓
Loan
   ↓
Payment

From a payment, the user should be able to navigate back to:

Loan
Customer

From a loan:

Customer
Payments
Collections
61. Breadcrumbs

Breadcrumbs may be used on desktop for deep screens.

Example:

Customers / Juan Pérez / Loan #001

They should help orientation without replacing the primary navigation.

62. Mobile UX

The mobile experience must not simply shrink the desktop interface.

On mobile:

Navigation becomes compact
Tables become cards/scrollable
Actions remain accessible
Forms become single-column
Metrics stack vertically
63. Mobile Dashboard

Recommended order:

Header
Quick actions
Balance
Today's collections
Overdue
Income/expenses
Recent activity

The most actionable information should appear first.

64. Mobile Loan Detail

Recommended order:

Loan header
Outstanding balance
Register payment
Overdue information
Installments
Payment history
Loan details

The payment action should remain easily accessible.

65. Mobile Customer Detail

Recommended order:

Customer identity
Financial summary
Active loans
Overdue
Recent payments
Customer information
66. Mobile Tables

Tables should not create unusable horizontal layouts.

Possible approaches:

Horizontal scrolling
Responsive cards
Expandable rows
Priority columns

The implementation should choose the most appropriate pattern for each dataset.

67. Accessibility

The UX must support:

Keyboard navigation
Screen readers
Visible focus
Readable contrast
Clear labels
Accessible error messages

Accessibility requirements are defined further in:

docs/design/DESIGN_SYSTEM.md
68. Financial Clarity

Every financial value must have enough context to be understood.

Bad:

$850,000

Better:

Outstanding balance
$850,000

Better:

Outstanding principal
$800,000

Interest
$40,000

Late fees
$10,000
69. Avoid Ambiguous Financial Labels

Do not use ambiguous labels such as:

Balance
Total
Amount
Paid

when the context is not obvious.

Prefer:

Outstanding balance
Total loan amount
Payment received
Principal paid
Interest paid
Late fees paid
70. User Feedback

Every important action should provide feedback.

Examples:

Customer created successfully.
Loan created successfully.
Payment registered successfully.
Transaction saved successfully.
Goal updated successfully.

Feedback should not interrupt the workflow unnecessarily.

71. Success Navigation

After successful creation, the application should generally navigate to the newly created resource or provide an obvious action to view it.

Example:

Loan created successfully.

[View loan]

This avoids leaving the user uncertain about where the new resource went.

72. Unsaved Changes

Forms with significant information should protect against accidental loss.

If the user attempts to leave a form containing unsaved changes, the application may show:

You have unsaved changes.

Leave without saving?

[Stay] [Leave]

This is especially important for:

Loan creation
Customer editing
Financial transaction editing
73. Optimistic UI

Optimistic UI should be used carefully.

It should generally NOT be used for authoritative financial mutations such as:

Register payment
Create loan
Reverse payment

The UI should wait for backend confirmation before presenting the financial operation as completed.

74. Financial Operation Feedback

For financial operations, the user should see:

Processing...

followed by:

Success

or:

Failure

The application must never visually report success before the backend confirms the operation.

75. Dashboard Refresh

After a financial mutation:

Payment registered

the affected dashboard information should update.

Potentially affected information:

Outstanding loans
Today's collections
Recent payments
Income
Loan balance
Overdue amount

The frontend may refetch authoritative data after successful mutations.

76. Data Freshness

Financial information shown to the user should be reasonably current.

When a screen depends on mutable financial state, the frontend should avoid assuming that previously loaded data remains valid indefinitely.

This is particularly important for:

Loan detail
Collections
Payments
Dashboard
77. Concurrent Changes

If a financial record changes while the user is viewing it, the application should handle the conflict gracefully.

Example:

Loan was updated by another operation.

Refresh to see the latest balance.

The application must not silently overwrite newer financial information.

78. UX for Overpayments

If the user enters a payment larger than the outstanding balance, the interface should explicitly explain the result.

Example:

Payment exceeds current outstanding balance.

Current outstanding:
$100,000

Payment:
$150,000

Remaining credit:
$50,000

The user must confirm before creating such a payment if the product rules require confirmation.

79. UX for Partial Payments

If a payment is partial, the UI should make the remaining amount visible.

Example:

Payment received
$50,000

Original obligation:
$100,000

Remaining:
$50,000

Status:
PARTIAL

The user should not have to manually calculate the remaining balance.

80. UX for Overdue Loans

Overdue information should be immediately understandable.

Example:

OVERDUE

8 days overdue

Outstanding:
$120,000

Late fees:
$10,000

Avoid using only a red badge without explaining the financial consequence.

81. Reports

Reports should provide summarized financial information.

Potential reports:

Income vs expenses
Monthly cash flow
Expense categories
Loan portfolio
Collection performance
Interest income
Late fee income
Outstanding balances

Reports should prioritize decision-making rather than decorative visualization.

82. Report Navigation

Reports should allow users to:

Select date range
Filter data
View summary
Inspect details

Export functionality may be added where appropriate.

83. Date Range UX

Date filters should provide convenient presets:

Today
This week
This month
Last month
This year
Custom

The user should always be able to understand which period is currently selected.

84. Settings

Settings should contain application-level configuration.

Possible sections:

Profile
Preferences
Categories
Notifications
Security

Financial rules should not be casually changed from settings unless explicitly supported by the business specification.

85. Authentication UX

The authentication experience should be simple.

Recommended screens:

Login
Register
Forgot password
Reset password

The UI should avoid unnecessary complexity.

86. Login

Login should require only necessary information.

Example:

Email
Password

[Log in]

Forgot password?
87. Session Expiration

If the session expires while using the application, the user should receive a clear message.

Example:

Your session has expired.

Please log in again.

The application should avoid losing unsaved work where reasonably possible.

88. Global UX Principles

Every PocketPal screen should follow:

1. Show what matters first.
2. Make the next action obvious.
3. Never hide important financial information.
4. Use consistent terminology.
5. Avoid unnecessary steps.
6. Never claim a financial operation succeeded before backend confirmation.
7. Keep financial calculations authoritative on the backend.
8. Make errors understandable.
9. Preserve financial history.
10. Maintain visual consistency.
89. Terminology Consistency

The same concept must always use the same label.

For example, do not alternate between:

Customer
Client
Borrower

throughout the UI.

PocketPal should use:

Customer

as the primary term.

Similarly:

Loan
Payment
Installment
Interest
Late fee
Principal
Outstanding balance

should remain consistent.

90. Primary User Flows

The following flows are considered core PocketPal journeys.

Flow 1 — Personal Expense
Dashboard
 ↓
Add expense
 ↓
Enter amount
 ↓
Select category
 ↓
Select date
 ↓
Save
 ↓
Success
 ↓
Dashboard updated
Flow 2 — Customer Creation
Customers
 ↓
New customer
 ↓
Customer information
 ↓
Save
 ↓
Customer detail
Flow 3 — Loan Creation
Customer
 ↓
New loan
 ↓
Loan configuration
 ↓
Review
 ↓
Create loan
 ↓
Loan detail
Flow 4 — Register Payment
Loan
 ↓
Register payment
 ↓
Enter amount
 ↓
Review allocation
 ↓
Confirm
 ↓
Payment registered
 ↓
Loan updated
Flow 5 — Daily Collection
Dashboard
 ↓
Today's collections
 ↓
Select customer
 ↓
View loan
 ↓
Register payment
 ↓
Confirm
 ↓
Collection updated
Flow 6 — Overdue Collection
Dashboard
 ↓
Overdue
 ↓
Select customer
 ↓
View loan
 ↓
Register payment
 ↓
Confirm
 ↓
Overdue balance updated
91. UX Priority

When deciding between two UX approaches, use this priority:

1. Financial correctness
2. User clarity
3. Speed of operation
4. Accessibility
5. Consistency
6. Visual aesthetics

A visually attractive interface must never make a financial operation ambiguous.

92. AI Development Rule

AI-generated interfaces must follow this document.

OpenCode must not independently invent:

new application sections;
new navigation patterns;
new terminology;
new financial states;
new payment workflows;
new loan workflows;
new business rules.

If an implementation requirement is not defined, OpenCode should use the closest documented pattern rather than inventing a new one.

If the decision materially affects product behavior, it must be documented before implementation.

93. Definition of UX Completion

A screen is considered UX-complete when:

its purpose is clear;
its primary action is obvious;
required information is visible;
loading states are defined;
empty states are defined;
error states are defined;
success states are defined;
responsive behavior is defined;
related navigation is clear;
financial terminology is consistent;
accessibility requirements are considered.
94. Final Principle

PocketPal should feel like a financial tool that gets out of the user's way.

The user should not need to understand the application's internal architecture or financial calculations to use it.

The interface should make complex financial information feel simple without hiding the underlying financial truth.

The fundamental UX principle is:

Simple to use, precise with money.