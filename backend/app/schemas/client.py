import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    normalized = value.lower()
    if not _EMAIL_RE.match(normalized):
        raise ValueError("Invalid email address")
    return normalized


class ClientCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=255)
    document_number: str | None = Field(default=None, max_length=64)
    phone: str | None = Field(default=None, max_length=32)
    alternative_phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=255)
    notes: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return _normalize_email(value)


class ClientUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    document_number: str | None = Field(default=None, max_length=64)
    phone: str | None = Field(default=None, max_length=32)
    alternative_phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=255)
    notes: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return _normalize_email(value)


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    document_number: str | None
    phone: str | None
    alternative_phone: str | None
    email: str | None
    address: str | None
    notes: str | None
    status: str
    created_at: datetime


class ClientSummaryResponse(BaseModel):
    client_id: UUID
    active_loans: int
    total_capital_lent: str
    outstanding_capital: str
    total_receivable: str
    total_overdue: str


class ReferenceCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=255)
    relationship: str | None = Field(default=None, max_length=64)
    notes: str | None = None


class ReferenceUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=255)
    relationship: str | None = Field(default=None, max_length=64)
    notes: str | None = None


class ReferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    name: str
    phone: str | None
    address: str | None
    relationship: str | None
    notes: str | None
    is_active: bool
