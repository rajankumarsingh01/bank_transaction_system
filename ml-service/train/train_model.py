import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score

FEATURES = [
    "amount",
    "hour",
    "sender_txn_count_last_hour",
    "amount_vs_avg_ratio",
    "is_new_receiver",
    "account_age_days"
]


def main():

    df = pd.read_csv("data/transactions.csv")

    X = df[ FEATURES ]
    y = df[ "is_fraud" ]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ( "scaler", StandardScaler() ),
        ( "classifier", LogisticRegression(class_weight="balanced", max_iter=1000) )
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[ :, 1 ]

    print("\n--- Classification Report ---")
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_proba):.4f}")

    os.makedirs("app/artifacts", exist_ok=True)
    joblib.dump(pipeline, "app/artifacts/fraud_model.joblib")

    print("\n✅ Model saved -> app/artifacts/fraud_model.joblib")


if __name__ == "__main__":
    main()