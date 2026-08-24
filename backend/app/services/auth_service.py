from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import create_token, hash_password, verify_password
from app.models.user import User
from app.repositories import user_repository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.finance_service import seed_default_categories
from app.core.logging import get_logger

logger = get_logger("pocketpal.auth")

_INVALID_CREDENTIALS = AppError(
    code="INVALID_CREDENTIALS",
    message="Invalid email or password.",
    http_status=401,
)


def register(db: Session, request: RegisterRequest) -> tuple[User, str, str]:
    """Create a user (+ default categories) and return (user, access, refresh)."""
    if user_repository.get_by_email(db, request.email) is not None:
        raise AppError(
            code="EMAIL_ALREADY_REGISTERED",
            message="An account with this email already exists.",
            http_status=409,
        )

    user = user_repository.create(
        db,
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
    )

    # Default categories are seeded in the same transaction as the user
    # (DATABASE.md §55): either both exist or neither does.
    seed_default_categories(db, user)
    db.commit()
    db.refresh(user)

    access_token, refresh_token = _issue_tokens(user.id)
    return user, access_token, refresh_token


def login(db: Session, request: LoginRequest) -> tuple[User, str, str]:
    """Authenticate a user and return (user, access_token, refresh_token).

    Fails identically for unknown email and wrong password (SECURITY.md §2.5).
    """
    user = user_repository.get_by_email(db, request.email)
    if user is None or not verify_password(request.password, user.password_hash):
        # Identifying detail only: never the attempted password.
        logger.warning("login_failed email=%s", request.email)
        raise _INVALID_CREDENTIALS

    if not user.is_active:
        raise AppError(
            code="USER_INACTIVE",
            message="This account is not active.",
            http_status=403,
        )

    access_token, refresh_token = _issue_tokens(user.id)
    return user, access_token, refresh_token


def refresh_access_token(db: Session, refresh_token: str) -> User:
    """Validate a refresh token and return the corresponding active user."""
    from app.core.security import InvalidTokenError, decode_token

    try:
        user_id = decode_token(refresh_token, expected_type="refresh")
    except InvalidTokenError as exc:
        raise AppError(
            code="INVALID_REFRESH_TOKEN",
            message="Refresh token is invalid or expired.",
            http_status=401,
        ) from exc

    user = user_repository.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise AppError(
            code="NOT_AUTHENTICATED",
            message="User is not available.",
            http_status=401,
        )

    return user


def get_user_by_id(db: Session, user_id: UUID) -> User:
    user = user_repository.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise AppError(
            code="NOT_AUTHENTICATED",
            message="User is not available.",
            http_status=401,
        )
    return user


def _issue_tokens(user_id: UUID) -> tuple[str, str]:
    return (
        create_token(user_id, token_type="access"),
        create_token(user_id, token_type="refresh"),
    )


def issue_access_token(user_id: UUID) -> str:
    return create_token(user_id, token_type="access")
