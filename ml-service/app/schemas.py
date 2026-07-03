from pydantic import BaseModel, Field


class TransactionFeatures(BaseModel):
    amount: float = Field(..., gt=0)
    hour: int = Field(..., ge=0, le=23)
    sender_txn_count_last_hour: int = Field(..., ge=0)
    amount_vs_avg_ratio: float = Field(..., ge=0)
    is_new_receiver: int = Field(..., ge=0, le=1)
    account_age_days: float = Field(..., ge=0)


class FraudPrediction(BaseModel):
    fraud_score: float
    is_flagged: bool
    threshold: float