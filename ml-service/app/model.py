import joblib
import os
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "artifacts", "fraud_model.joblib")

FEATURES = [
    "amount",
    "hour",
    "sender_txn_count_last_hour",
    "amount_vs_avg_ratio",
    "is_new_receiver",
    "account_age_days"
]

_model = None


def load_model():

    global _model

    if _model is None:

        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. Run train/train_model.py first."
            )

        _model = joblib.load(MODEL_PATH)

    return _model


def predict(features: dict) -> float:

    model = load_model()

    df = pd.DataFrame([ features ], columns=FEATURES)

    proba = model.predict_proba(df)[ 0 ][ 1 ]

    return float(proba)