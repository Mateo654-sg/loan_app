from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_by_id(db: Session, user_id: UUID) -> User | None:
    return db.get(User, user_id)


def create(db: Session, *, email: str, password_hash: str, full_name: str) -> User:
    """Persist a new user. Flushes only; the service owns the commit so
    related setup (e.g. category seeding) stays atomic."""
    user = User(email=email, password_hash=password_hash, full_name=full_name)
    db.add(user)
    db.flush()
    return user
