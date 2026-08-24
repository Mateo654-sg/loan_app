"""PocketPal financial calculation engine.

Pure, deterministic, dependency-free calculators (ARCHITECTURE.md §14–15).
No HTTP, database or UI imports are allowed in this package.
"""
from app.calculators.amortization import (
    AmortizationType,
    InstallmentComponent,
    ScheduleInput,
    generate_schedule,
)
from app.calculators.dates import (
    DateEngineError,
    PaymentFrequency,
    ScheduleDatesInput,
    days_overdue,
    generate_due_dates,
)
from app.calculators.interest import calculate_period_interest
from app.calculators.late_fees import LateFeeConfig, LateFeeType, calculate_late_fee
from app.calculators.payment_allocation import (
    AllocationResult,
    InstallmentAllocation,
    OutstandingInstallment,
    allocate_payment,
)
from app.calculators.rounding import quantize_money
from app.calculators.statuses import (
    InstallmentStatus,
    derive_installment_status,
    outstanding_amount,
)

__all__ = [
    "AllocationResult",
    "AmortizationType",
    "DateEngineError",
    "InstallmentAllocation",
    "InstallmentComponent",
    "InstallmentStatus",
    "LateFeeConfig",
    "LateFeeType",
    "OutstandingInstallment",
    "PaymentFrequency",
    "ScheduleDatesInput",
    "ScheduleInput",
    "allocate_payment",
    "calculate_late_fee",
    "calculate_period_interest",
    "days_overdue",
    "derive_installment_status",
    "generate_due_dates",
    "generate_schedule",
    "outstanding_amount",
    "quantize_money",
]
