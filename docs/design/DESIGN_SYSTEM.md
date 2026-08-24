# PocketPal — Design System

**Version:** 1.0  
**Status:** Official Design System  
**Product:** PocketPal  
**Related documents:**
- `docs/PRODUCT_SPECIFICATION.md`
- `docs/design/UI_UX.md`

---

# 1. Purpose

This document defines the official visual design system for PocketPal.

It establishes the rules for:

- colors;
- typography;
- spacing;
- borders;
- radius;
- shadows;
- buttons;
- inputs;
- cards;
- badges;
- tables;
- navigation;
- financial indicators;
- loan indicators;
- states;
- responsive behavior;
- accessibility;
- component consistency.

The purpose is to ensure that every PocketPal screen feels like part of the same product.

The design system must be treated as a product-level specification, not as a collection of optional suggestions.

---

# 2. Design Philosophy

PocketPal is a personal finance and lending management application.

The interface must communicate:

```text
Clarity
Trust
Control
Simplicity
Professionalism

The application handles financial information, therefore the visual design must prioritize:

Readability.
Information hierarchy.
Fast recognition of financial states.
Low cognitive load.
Consistency.
Clear actions.
Trustworthy presentation of financial data.

The interface should feel modern without becoming visually complicated.

3. General Visual Direction

PocketPal should use a:

Modern
Clean
Minimal
Professional
Finance-oriented
Responsive
Dashboard-focused

visual language.

Avoid excessive:

gradients;
decorative elements;
animations;
oversized typography;
excessive shadows;
excessive borders;
unnecessary illustrations;
visual noise.

The application should prioritize the user's financial information.

4. Product Areas

PocketPal contains two closely related domains:

PERSONAL FINANCE
        +
LENDING MANAGEMENT

The visual language must remain consistent across both.

The user should never feel as though they have entered a completely different application when switching between:

Finances
Loans
Customers
Collections
Reports
5. Visual Hierarchy

Every screen must have a clear hierarchy.

The recommended hierarchy is:

Page
 ├── Page title
 ├── Context / description
 ├── Primary action
 ├── Key metrics
 ├── Main content
 └── Secondary information

Primary information should always have greater visual weight than secondary information.

6. Layout Principles

PocketPal screens should use generous whitespace.

Content should not touch the edges of the viewport unless specifically required for mobile layouts.

Desktop layouts should generally use:

Main navigation
      ↓
Content container
      ↓
Page sections

The application must avoid unnecessarily wide content.

Recommended maximum content width:

1200px

For data-heavy screens, the container may expand when necessary.

7. Spacing System

PocketPal uses a base spacing unit of:

4px

Recommended spacing scale:

Token	Value
space-1	4px
space-2	8px
space-3	12px
space-4	16px
space-5	20px
space-6	24px
space-8	32px
space-10	40px
space-12	48px
space-16	64px

Components should use these values instead of arbitrary spacing.

Avoid values such as:

13px
17px
23px
29px

unless there is a specific visual reason.

8. Border Radius

PocketPal should use moderately rounded components.

Recommended radius tokens:

Token	Value
radius-sm	6px
radius-md	8px
radius-lg	12px
radius-xl	16px
radius-full	9999px

Default component radius:

radius-md

Cards may use:

radius-lg

Badges and pills may use:

radius-full

Avoid excessive rounding that makes the interface look playful rather than professional.

9. Color Philosophy

Color in PocketPal must communicate meaning.

Color should not be used only for decoration.

Financial colors should consistently represent:

Positive
Negative
Warning
Neutral
Information

The exact palette must be centralized in design tokens.

Components must not define their own arbitrary colors.

10. Primary Color

PocketPal must have one primary brand color.

The primary color is used for:

primary buttons;
active navigation;
links;
selected states;
important actions;
focus states;
primary highlights.

The primary color must have sufficient contrast against its background.

The final hexadecimal value must be defined as a design token in the implementation.

Example token:

--color-primary

The application must not scatter hardcoded primary colors throughout components.

11. Neutral Colors

Neutral colors form the foundation of the interface.

Required semantic tokens:

--color-background
--color-surface
--color-surface-secondary

--color-text-primary
--color-text-secondary
--color-text-muted

--color-border
--color-border-subtle

Neutral colors should create hierarchy without requiring excessive visual decoration.

12. Semantic Colors

PocketPal must define semantic colors.

Success

Used for:

successful payments;
positive financial values;
completed loans;
paid installments;
successful operations.

Token:

--color-success
Danger

Used for:

negative balances;
overdue loans;
failed operations;
destructive actions;
critical warnings.

Token:

--color-danger
Warning

Used for:

upcoming payments;
pending collections;
approaching due dates;
attention-required states.

Token:

--color-warning
Information

Used for:

informational messages;
neutral financial insights;
contextual explanations.

Token:

--color-info
13. Financial Color Rules

Financial values must follow semantic rules.

Positive financial movement:

Success

Expenses / negative movement:

Danger

Pending obligations:

Warning

Neutral values:

Neutral

Example:

Income       +$2,500,000  → positive
Expenses     -$1,200,000  → negative
Pending       $300,000    → warning
Balance      $1,300,000   → neutral/positive context

Color must never be the only indicator of meaning.

14. Loan Status Colors

Loan statuses should have consistent visual treatment.

Recommended semantic mapping:

Status	Visual meaning
ACTIVE	Neutral / primary
OVERDUE	Danger
PAID	Success
CANCELLED	Muted / neutral

The same mapping must be used throughout:

loan list;
loan details;
customer details;
dashboard;
collections;
reports.
15. Installment Status Colors

Recommended mapping:

Status	Color meaning
PENDING	Neutral
DUE	Warning
OVERDUE	Danger
PARTIAL	Warning
PAID	Success
16. Typography

PocketPal must use a modern sans-serif typeface.

The typography system should prioritize:

Readability
Numerical clarity
Compact dashboards
Clear hierarchy

Recommended font stack:

Inter,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif

If the selected frontend framework supports a bundled font, the font should be centralized rather than imported independently by individual components.

17. Typography Scale

Recommended typography tokens:

Token	Size	Weight
text-xs	12px	400–500
text-sm	14px	400–500
text-md	16px	400
text-lg	18px	500–600
text-xl	20px	600
text-2xl	24px	600
text-3xl	30px	600–700
text-4xl	36px	700

Avoid excessive use of very large headings.

18. Page Titles

Page titles should use:

text-2xl

or:

text-3xl

depending on screen size.

Example:

Dashboard

Secondary page descriptions should use:

text-sm

or:

text-md

with secondary text color.

19. Financial Numbers

Financial values are high-priority information.

They should have:

strong visual hierarchy;
tabular/numerical clarity;
consistent currency formatting.

Example:

$2,450,000

rather than:

2450000

Large dashboard metrics may use:

text-2xl

or:

text-3xl
20. Currency Formatting

The UI must use a consistent currency format.

For Colombian pesos:

$1.250.000

or the application's configured locale equivalent.

The frontend must not format financial values independently in every component.

A centralized formatting utility must be used.

21. Negative Values

Negative values should be visually identifiable.

Example:

-$250.000

or the locale-equivalent negative currency representation.

The system should use the semantic danger color.

However, the minus sign must remain visible.

Color alone must not communicate negativity.

22. Icons

Icons should be used to improve recognition, not decoration.

Recommended icon style:

Simple
Line-based
Consistent stroke
Minimal

All icons should come from the same icon library.

Do not mix multiple icon styles.

23. Icon Sizes

Recommended sizes:

Usage	Size
Inline	16px
Small action	18px
Standard	20px
Navigation	20–22px
Large metric	24–32px

Icons should not dominate text.

24. Buttons

Buttons must clearly communicate hierarchy.

Three primary variants are recommended:

Primary
Secondary
Danger

Additional variants may include:

Ghost
Outline
Link
25. Primary Button

Used for the main action of a screen.

Examples:

+ Add expense
+ Add income
+ New customer
+ New loan
Register payment

Primary buttons should have:

primary background;
high-contrast text;
clear hover state;
clear disabled state;
accessible focus state.
26. Secondary Button

Used for actions that are important but not the main action.

Examples:

Cancel
Export
Filter
View details

Secondary buttons should not visually compete with the primary action.

27. Danger Button

Used for destructive actions.

Examples:

Delete customer
Cancel loan
Reverse payment

Destructive actions must not use the primary color.

28. Button Sizing

Recommended button heights:

Small:    32px
Medium:   40px
Large:    48px

Default:

40px

Buttons should have sufficient horizontal padding and must not feel cramped.

29. Button Text

Button labels should describe the action.

Prefer:

Register payment
Create loan
Add expense
Save customer

Avoid ambiguous labels:

Continue
Submit
Process
Action

when a more explicit label is possible.

30. Inputs

Inputs must be:

Clear
Readable
Predictable
Accessible

Required states:

Default
Hover
Focus
Filled
Error
Disabled
Read-only
31. Input Labels

Every input must have a visible or programmatically associated label.

Examples:

Customer name
Loan amount
Interest rate
Due date
Payment amount

Placeholder text must not replace the label.

32. Financial Inputs

Financial inputs must clearly communicate expected units.

Examples:

Loan amount
$ 1,000,000
Interest rate
12 %
Payment amount
$ 250,000

The formatting behavior must remain consistent.

33. Form Validation

Validation errors must appear close to the affected input.

Example:

Loan amount

[ $0 ]

Loan amount must be greater than zero.

Errors should use:

Danger color

but must also contain explanatory text.

34. Cards

Cards are used to group related information.

Examples:

Total balance
Monthly income
Monthly expenses
Outstanding loans
Today's collections

Default card characteristics:

Background: surface
Border: subtle
Radius: radius-lg
Padding: space-6

Shadows should be subtle and used only when necessary.

35. Metric Cards

Metric cards should contain:

Label
Value
Optional trend/context
Optional icon

Example:

Outstanding loans

$4,250,000

3 active loans

The value should have the greatest visual hierarchy.

36. Dashboard Metrics

The main dashboard should prioritize metrics relevant to the user's financial activity.

Possible metrics:

Total balance
Income
Expenses
Savings
Outstanding loans
Today's collections
Overdue amount

The exact metrics belong to the product specification and UI/UX documentation.

The design system only defines how metrics are visually represented.

37. Tables

Tables are important for:

customers;
loans;
payments;
transactions;
collections.

Tables must prioritize:

Readable columns
Clear alignment
Compact rows
Sortable headers where applicable
Responsive behavior
38. Financial Table Alignment

Numbers should generally be right-aligned.

Example:

Customer          Amount
Juan Pérez        $250.000
María López       $180.000

Text:

left-aligned

Numbers:

right-aligned

Dates may be aligned according to the table layout.

39. Table Row Actions

Row actions should not visually dominate the data.

Preferred patterns:

View
Edit
More

Destructive actions should generally be hidden under:

More

rather than displayed as prominent buttons.

40. Badges

Badges communicate short statuses.

Examples:

ACTIVE
OVERDUE
PAID
PENDING
PARTIAL

Badges should be:

compact;
readable;
semantically colored;
consistent.
41. Badge Rules

Badges should not contain long sentences.

Good:

OVERDUE

Bad:

This loan is currently overdue and requires payment

Additional explanation belongs outside the badge.

42. Alerts

Alerts communicate important contextual information.

Types:

Success
Warning
Danger
Info

Examples:

Payment registered successfully.
This customer has overdue installments.
This payment will generate a credit balance.
43. Modals

Modals should be used for focused actions.

Good use cases:

Register payment
Delete customer
Reverse payment
Confirm cancellation

Avoid using modals for large workflows that require extensive navigation.

44. Payment Modal

The payment registration modal should prioritize:

Customer
Loan
Amount
Date
Payment method

After submission, the result should clearly show:

Payment amount
Late fees paid
Interest paid
Principal paid
Remaining balance

The allocation is determined by the backend.

45. Confirmation Dialogs

Destructive financial actions require confirmation.

Examples:

Reverse payment
Cancel loan
Delete customer

The confirmation must explain the consequence.

Example:

Reverse this payment?

This will restore the payment's financial effects
and modify the outstanding loan balance.

[Cancel] [Reverse payment]
46. Toast Notifications

Toast notifications may be used for short-lived feedback.

Examples:

Customer created.
Payment registered.
Expense saved.

They must not contain essential information that the user needs to reference later.

Financial allocation details should be displayed in the relevant screen or confirmation result.

47. Loading States

The application must avoid blank screens during loading.

Use:

Skeletons
Spinners
Progress indicators

depending on context.

For dashboards, skeleton cards are preferred over a full-screen spinner.

48. Empty States

Empty states should explain what the user can do.

Example:

No customers yet.

Add your first customer to start managing loans.

[+ New customer]

Avoid empty screens with no explanation.

49. Error States

Errors must be understandable.

Avoid exposing raw technical errors such as:

500 Internal Server Error

to normal users.

Instead:

We couldn't register the payment.

Please try again.

Technical details should be available through logs rather than the normal UI.

50. Navigation

PocketPal navigation must distinguish the main product areas.

Recommended conceptual structure:

Dashboard

Personal Finance
 ├── Transactions
 ├── Categories
 └── Goals

Lending
 ├── Customers
 ├── Loans
 ├── Collections
 └── Payments

Reports

The final navigation structure is defined by the UI/UX specification.

51. Active Navigation

The current section must be visually identifiable.

Use:

Primary color
Background highlight
Icon/text emphasis

Avoid relying solely on bold text.

52. Sidebar

On desktop, PocketPal may use a sidebar navigation.

The sidebar should contain:

PocketPal logo
Main navigation
Secondary navigation
User/account controls

The sidebar must not consume excessive screen width.

Recommended width:

240px – 280px
53. Mobile Navigation

On smaller screens, the sidebar should transform into an appropriate mobile navigation pattern.

Possible approaches:

Bottom navigation
Drawer
Compact top navigation

The most important actions must remain easily accessible.

54. Responsive Breakpoints

The design system should support at least:

Mobile
Tablet
Desktop
Large desktop

Suggested breakpoints:

sm: 640px
md: 768px
lg: 1024px
xl: 1280px

The implementation may adjust these according to the selected frontend framework.

55. Mobile Priority

On mobile:

Content > Decoration

The application should prioritize:

Financial balance
Today's obligations
Quick actions
Recent activity

Tables may become:

Cards
Scrollable tables
Condensed lists

depending on the screen.

56. Desktop Priority

Desktop layouts can display more simultaneous information.

Dashboard may use:

Metric grid
Charts
Recent transactions
Collection summary
Loan summary

without overwhelming the user.

57. Charts

Charts must communicate useful financial information.

Avoid charts that exist only for decoration.

Possible charts:

Income vs expenses
Expense categories
Loan collection progress
Outstanding balances
Monthly cash flow

Charts must have:

clear labels;
readable legends;
accessible alternatives;
consistent colors;
meaningful units.
58. Chart Colors

Charts must use the application's semantic palette.

For example:

Income → Success
Expenses → Danger
Pending → Warning
Neutral → Information/Neutral

The exact implementation must use centralized design tokens.

Do not hardcode colors independently in chart components.

59. Accessibility

PocketPal must target accessible interfaces.

At minimum:

WCAG-oriented contrast
Keyboard navigation
Visible focus states
Semantic HTML
Accessible labels
Screen-reader-friendly controls

The interface must not depend exclusively on color.

60. Contrast

Text must maintain sufficient contrast against its background.

Important financial values must have strong contrast.

Muted text should still remain readable.

Do not use very light gray text on white backgrounds merely for aesthetic purposes.

61. Focus States

Interactive elements must have visible focus states.

Focus must not be removed with:

outline: none;

unless an accessible replacement is provided.

62. Touch Targets

Mobile interactive elements should have sufficiently large touch targets.

Recommended minimum:

44px × 44px

This applies particularly to:

navigation;
buttons;
icon buttons;
checkboxes;
list actions.
63. Icon Buttons

Icon-only buttons must include accessible labels.

Example:

aria-label="View customer"

The user must understand the action even without visually interpreting the icon.

64. Motion

Animations should be subtle.

Use animation for:

Transitions
Loading
Feedback
Navigation

Avoid:

Excessive bouncing
Large transitions
Distracting animations

Recommended duration range:

150ms – 250ms
65. Reduced Motion

The application should respect:

prefers-reduced-motion

Users who request reduced motion should receive minimal or no non-essential animation.

66. Dark Mode

Dark mode may be supported as part of PocketPal's visual system.

If implemented, dark mode must use dedicated semantic tokens.

Do not simply invert colors.

Example:

Light:
background → light
surface → white

Dark:
background → dark
surface → dark elevated

Financial semantic colors must remain readable in both modes.

67. Component Consistency

The same component must look and behave consistently throughout PocketPal.

For example:

The CustomerBadge component should not have different styling on:

Dashboard
Customer page
Loan page
Collections page

unless the context explicitly requires a different variant.

68. Design Tokens

All reusable visual values should be centralized.

Conceptual structure:

tokens/
├── colors
├── typography
├── spacing
├── radius
├── shadows
├── breakpoints
└── motion

Components consume tokens instead of defining arbitrary values.

69. No Hardcoded Design Values

Avoid:

color: #123456;
margin: 17px;
border-radius: 11px;

inside individual components when an equivalent design token exists.

Prefer:

primary color token
spacing token
radius token

This allows the entire application to evolve consistently.

70. Component Variants

Components should expose controlled variants.

Example:

Button
 ├── primary
 ├── secondary
 ├── danger
 ├── ghost
 └── outline

Avoid creating dozens of one-off components.

71. Reusable Financial Components

PocketPal should prioritize reusable financial components such as:

MoneyDisplay
MetricCard
StatusBadge
PaymentSummary
LoanBalance
InstallmentStatus
CollectionCard
TransactionRow
FinancialSummary

These components should consume the design system.

72. MoneyDisplay

A centralized money display component should handle:

currency
positive/negative state
locale formatting
size
semantic color

Example:

<MoneyDisplay value={2500000} />

The component determines the correct visual representation.

73. StatusBadge

A centralized status badge should receive a semantic status.

Example:

<StatusBadge status="OVERDUE" />

The component determines:

label
color
icon if applicable

This avoids inconsistent status presentation.

74. Loan Balance Component

Loan balances should visually distinguish:

Principal
Interest
Late fees
Total outstanding

Example:

Outstanding balance

Principal       $800,000
Interest         $40,000
Late fees        $10,000
-------------------------
Total            $850,000
75. Payment Summary Component

After registering a payment, the application should use a consistent payment summary.

Example:

Payment registered

Total paid              $250,000

Late fees                $10,000
Interest                 $40,000
Principal               $200,000

Remaining balance       $800,000

This component should be reusable across:

Payment modal
Payment detail
Loan detail
Customer history
76. Data Density

PocketPal is a finance application and therefore requires moderate information density.

The interface should not be excessively spacious to the point of hiding useful information.

At the same time, dense information must remain readable.

The target is:

High information value
+
Low visual noise
77. Financial Trust

Visual design must communicate financial trust.

Avoid UI patterns that make financial information look uncertain.

Important values should have:

clear labels
clear units
consistent formatting
predictable placement
78. Destructive Financial Actions

Financially destructive operations must always be visually distinct.

Examples:

Reverse payment
Cancel loan
Delete transaction

These operations should:

require confirmation
clearly explain consequences
use danger styling
79. Design Rules for AI Development

AI-generated UI must follow this document.

OpenCode must not:

invent a new color palette;
introduce random spacing values;
introduce unrelated fonts;
mix icon libraries;
create inconsistent button styles;
create arbitrary status colors;
use color as the only status indicator;
create different versions of the same component without justification.

If a visual decision is not defined here, the implementation should prefer the closest existing design token or reusable component.

If a new design decision is necessary and materially changes the visual system, it should be documented before implementation.

80. Design System Priority

When visual decisions conflict, priority should be:

1. Accessibility
2. Financial clarity
3. Consistency
4. Usability
5. Visual aesthetics

Aesthetic preference must never override financial clarity or accessibility.

81. Definition of Design-System Compliance

A PocketPal screen is considered compliant when:

it uses the defined typography;
it uses centralized color tokens;
it follows the spacing system;
it uses standardized component variants;
financial values follow formatting rules;
statuses use semantic mappings;
interactive elements have accessible states;
responsive behavior is implemented;
no unnecessary one-off visual patterns are introduced.
82. Final Principle

PocketPal's design system exists to make the application feel like one coherent product.

Every screen should answer the following question:

"Does this look and behave like PocketPal?"

If the answer is no, the implementation must be reviewed against this document before introducing new visual patterns.
