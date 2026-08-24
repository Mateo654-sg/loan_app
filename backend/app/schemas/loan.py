from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class InterestPeriod(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


class AmortizationTypeEnum(str, Enum):
    FIXED_PRINCIPAL = "FIXED_PRINCIPAL"
    FRENCH = "FRENCH"


class PaymentFrequencyEnum(str, Enum):
    ONCE = "ONCE"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    CUSTOM = "CUSTOM"


# v1.0 explicit compatibility rule (LOAN_RULES.md §16): the configured rate
# is applied once per installment. Combining a rate period with an
# incompatible payment frequency would silently produce wrong interest, so
# it is rejected at creation instead of inventing an undocumented conversion.
_FREQUENCY_TO_PERIOD: dict[PaymentFrequencyEnum, set[InterestPeriod]] = {
    PaymentFrequencyEnum.ONCE: set(InterestPeriod),  # single application: any rate
    PaymentFrequencyEnum.DAILY: {InterestPeriod.DAILY},
    PaymentFrequencyEnum.WEEKLY: {InterestPeriod.WEEKLY},
    PaymentFrequencyEnum.BIWEEKLY: {InterestPeriod.BIWEEKLY},
    PaymentFrequencyEnum.MONTHLY: {InterestPeriod.MONTHLY},
    PaymentFrequencyEnum.CUSTOM: set(InterestPeriod),  # irregular dates: any
}


class LateFeeConfigInput(BaseModel):
    enabled: bool = False
    type: str | None = None  # validated against calculator enum in service
    value: Decimal = Field(default=Decimal(0), ge=0)
    grace_period_days: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_type_required_when_enabled(self) -> "LateFeeConfigInput":
        if self.enabled:
            if self.type not in ("FIXED_AMOUNT", "PERCENTAGE", "DAILY_PERCENTAGE"):
                raise ValueError("late fee type must be FIXED_AMOUNT, PERCENTAGE or DAILY_PERCENTAGE when enabled")
        return self


def _max_two_decimals(value: Decimal) -> Decimal:
    if -value.as_tuple().exponent > 2:
        raise ValueError("supports at most 2 decimal places")
    return value


class LoanCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    client_id: UUID
    principal: Decimal = Field(gt=0)
    start_date: date
    interest_rate: Decimal = Field(ge=0, le=100000)
    interest_period: InterestPeriod
    amortization_type: AmortizationTypeEnum
    payment_frequency: PaymentFrequencyEnum
    number_of_installments: int = Field(ge=1, le=360)
    first_due_date: date
    guarantee: str | None = None
    notes: str | None = None
    late_fee_configuration: LateFeeConfigInput | None = None

    @field_validator("principal")
    @classmethod
    def validate_principal(cls, value: Decimal) -> Decimal:
        return _max_two_decimals(value)

    @model_validator(mode="after")
    def validate_combination(self) -> "LoanCreate":
        if self.payment_frequency == PaymentFrequencyEnum.ONCE and self.number_of_installments != 1:
            raise ValueError("ONCE frequency requires exactly one installment")

        allowed_periods = _FREQUENCY_TO_PERIOD[self.payment_frequency]
        if self.interest_period not in allowed_periods:
            raise ValueError(
                f"interest_period {self.interest_period.value} is not compatible with "
                f"payment_frequency {self.payment_frequency.value} (v1.0 applies the "
                "configured rate once per installment; no conversion exists)"
            )

        if self.first_due_date < self.start_date:
            raise ValueError("first_due_date cannot be earlier than start_date")

        return self


class InstallmentResponse(BaseModel):
    id: UUID
    installment_number: int
    due_date: date
    principal_due: str
    interest_due: str
    late_fee_due: str
    total_due: str
    principal_paid: str
    interest_paid: str
    late_fee_paid: str
    remaining_balance: str
    status: str


class LoanScheduleResponse(BaseModel):
    loan_id: UUID
    business_date: date
    installments: list[InstallmentResponse]


class LoanResponse(BaseModel):
    id: UUID
    client_id: UUID
    client_name: str
    principal: str
    outstanding_principal: str
    scheduled_interest: str
    outstanding_interest: str
    collected_interest: str
    scheduled_late_fees: str
    outstanding_late_fees: str
    collected_late_fees: str
    total_outstanding: str
    interest_rate: str
    interest_period: str
    amortization_type: str
    payment_frequency: str
    number_of_installments: int
    first_due_date: date
    status: str
    guarantee: str | None
    notes: str | None
    created_at: datetime


class LoanListResponseItem(LoanResponse):
    pass


LoanResponse.model_rebuild()
