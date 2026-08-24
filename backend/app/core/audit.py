from uuid import UUID, uuid4
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def record_audit(
    db: Session,
    *,
    user_id: UUID,
    action: str,
    entity_type: str,
    entity_id: UUID | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Append an audit record. Flush-only: the owning service controls the
    transaction so the audit is atomic with the financial operation
    (ARCHITECTURE.md §35)."""
    db.add(
        AuditLog(
            id=uuid4(),
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata or {},
        )
    )
    db.flush()
