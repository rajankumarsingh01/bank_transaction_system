import os
from fastapi import FastAPI, HTTPException

from .schemas import TransactionFeatures, FraudPrediction
from .model import predict, load_model

FRAUD_THRESHOLD = float(os.getenv("FRAUD_SCORE_THRESHOLD", "0.7"))

app = FastAPI(
    title="Fraud Detection Service",
    description="Lightweight ML microservice for scoring transaction fraud risk",
    version="1.0.0"
)


@app.on_event("startup")
def startup_event():
    try:
        load_model()
        print("✅ Fraud detection model loaded successfully")
    except FileNotFoundError as e:
        print(f"⚠️  WARNING: {e}")


@app.get("/health")
def health():
    return { "status": "ok" }


@app.post("/predict", response_model=FraudPrediction)
def predict_fraud(features: TransactionFeatures):

    try:
        score = predict(features.dict())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return FraudPrediction(
        fraud_score=round(score, 4),
        is_flagged=score >= FRAUD_THRESHOLD,
        threshold=FRAUD_THRESHOLD
    )