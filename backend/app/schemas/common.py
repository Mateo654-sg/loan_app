from decimal import Decimal
from typing import Generic, TypeVar

from pydantic import BaseModel

ItemT = TypeVar("ItemT")


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[ItemT]):
    items: list[ItemT]
    pagination: PaginationMeta


def format_money(value: Decimal) -> str:
    """Serialize a monetary value deterministically with 2 decimals (API.md §60)."""
    return str(value.quantize(Decimal("0.01")))
