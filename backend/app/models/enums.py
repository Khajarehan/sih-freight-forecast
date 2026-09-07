import enum


class ContractType(enum.Enum):
    SPOT = "SPOT"
    PERIOD = "PERIOD"


class RateBasis(enum.Enum):
    VOYAGE_USD_PER_TONNE = "VOYAGE_USD_PER_TONNE"
    TIME_CHARTER_USD_PER_DAY = "TIME_CHARTER_USD_PER_DAY"


class RunStatus(enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
