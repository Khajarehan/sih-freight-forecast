"""Validation step: turn untrusted payloads into validated raw contracts."""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from typing import Any, Generic, TypeVar

from pydantic import ValidationError

from app.services.ingestion.contracts import RawRecord

RawT = TypeVar("RawT", bound=RawRecord)


@dataclass
class RejectedPayload:
    index: int
    payload: Mapping[str, Any]
    error: str


@dataclass
class ValidationResult(Generic[RawT]):
    accepted: list[RawT] = field(default_factory=list)
    rejected: list[RejectedPayload] = field(default_factory=list)


def validate_payloads(
    contract: type[RawT], payloads: Iterable[Mapping[str, Any]], *, strict: bool = True
) -> ValidationResult[RawT]:
    """Validate payloads against a contract.

    With `strict=True` the first invalid payload raises; otherwise invalid payloads
    are collected in `rejected` so a feed can be partially ingested.
    """
    result: ValidationResult[RawT] = ValidationResult()
    for index, payload in enumerate(payloads):
        try:
            result.accepted.append(contract.model_validate(payload))
        except ValidationError as error:
            if strict:
                raise
            result.rejected.append(RejectedPayload(index=index, payload=payload, error=str(error)))
    return result
