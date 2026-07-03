import numpy as np
import pandas as pd
import os

np.random.seed(42)


def generate_dataset(n_samples=8000):

    rows = []

    for _ in range(n_samples):

        is_fraud = np.random.rand() < 0.12

        # 15% "hard" cases: fraud that looks mostly normal, or normal that looks risky
        is_noisy = np.random.rand() < 0.15

        if is_fraud:

            if is_noisy:
                # Fraud that slips through looking fairly normal
                amount = np.random.uniform(200, 6000)
                hour = np.random.randint(6, 23)
                sender_txn_count_last_hour = np.random.poisson(1.2)
                amount_vs_avg_ratio = np.random.uniform(0.8, 3)
                is_new_receiver = np.random.choice([ 0, 1 ], p=[ 0.5, 0.5 ])
                account_age_days = np.random.uniform(30, 400)
            else:
                amount = np.random.choice(
                    [ np.random.uniform(15000, 100000), np.random.uniform(500, 3000) ],
                    p=[ 0.6, 0.4 ]
                )
                hour = np.random.choice(
                    list(range(0, 5)) + list(range(5, 24)),
                    p=[ 0.08 ] * 5 + [ 0.6 / 19 ] * 19
                )
                sender_txn_count_last_hour = np.random.poisson(3.5)
                amount_vs_avg_ratio = np.random.uniform(2.5, 12)
                is_new_receiver = np.random.choice([ 0, 1 ], p=[ 0.25, 0.75 ])
                account_age_days = np.random.exponential(25)

        else:

            if is_noisy:
                # Normal transaction that happens to look a bit risky
                amount = np.random.uniform(4000, 18000)
                hour = np.random.randint(0, 24)
                sender_txn_count_last_hour = np.random.poisson(2)
                amount_vs_avg_ratio = np.random.uniform(1.5, 4)
                is_new_receiver = np.random.choice([ 0, 1 ], p=[ 0.4, 0.6 ])
                account_age_days = np.random.uniform(5, 60)
            else:
                amount = np.random.uniform(50, 5000)
                hour = np.random.randint(6, 23)
                sender_txn_count_last_hour = np.random.poisson(0.5)
                amount_vs_avg_ratio = np.random.uniform(0.2, 2.5)
                is_new_receiver = np.random.choice([ 0, 1 ], p=[ 0.7, 0.3 ])
                account_age_days = np.random.uniform(10, 800)

        # Small random jitter on the ratio/amount to avoid overly clean boundaries
        amount = max(10, amount * np.random.normal(1, 0.05))
        amount_vs_avg_ratio = max(0.05, amount_vs_avg_ratio * np.random.normal(1, 0.08))

        rows.append({
            "amount": round(amount, 2),
            "hour": int(hour),
            "sender_txn_count_last_hour": int(sender_txn_count_last_hour),
            "amount_vs_avg_ratio": round(amount_vs_avg_ratio, 2),
            "is_new_receiver": int(is_new_receiver),
            "account_age_days": round(account_age_days, 1),
            "is_fraud": int(is_fraud)
        })

    return pd.DataFrame(rows)


if __name__ == "__main__":

    os.makedirs("data", exist_ok=True)

    df = generate_dataset()
    df.to_csv("data/transactions.csv", index=False)

    print(f"Generated {len(df)} rows -> data/transactions.csv")
    print(df[ "is_fraud" ].value_counts())