from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import InvalidTokenError, decode_token
from app.db.session import get_db
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if credentials is None:
        raise AppError(code="NOT_AUTHENTICATED", message="Authentication required.", http_status=401)

    try:
        user_id = decode_token(credentials.credentials, expected_type="access")
    except InvalidTokenError:
        raise AppError(
            code="INVALID_TOKEN",
            message="Invalid or expired authentication token.",
            http_status=401,
        ) from None

    user: User | None = db.get(User, user_id)
    if user is None or not user.is_active:
        raise AppError(
            code="NOT_AUTHENTICATED",
            message="User is not available.",
            http_status=401,
        )

    return user


def get_current_user_id(user: Annotated[User, Depends(get_current_user)]) -> UUID:
    return user.id
