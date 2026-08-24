"""Centralized application logging (ARCHITECTURE.md §43).

Rules enforced here:
* Never log passwords, tokens or secrets (SECURITY.md §46).
* Financial/security-relevant events are logged with identifiers only
  (UUIDs), never payload contents.
"""
import logging
import sys


def configure_logging() -> None:
    root = logging.getLogger()
    if root.handlers:  # already configured (e.g. tests re-importing)
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    )
    root.addHandler(handler)
    root.setLevel(logging.INFO)

    # Uvicorn already emits access logs; align levels.
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


__all__ = ["configure_logging", "get_logger"]
