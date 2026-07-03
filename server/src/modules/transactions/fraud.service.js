const logger = require("../../shared/logger/logger");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

class FraudService {

    async getFraudScore(features) {

        try {

            const response = await fetch(`${ML_SERVICE_URL}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(3000),
                body: JSON.stringify(features)
            });

            if (!response.ok) {
                throw new Error(`ML service responded with status ${response.status}`);
            }

            return await response.json();

        } catch (err) {

            logger.error(
                { err: err.message },
                "Fraud detection service unreachable, allowing transaction with default score (fail-open)"
            );

            return { fraud_score: 0, is_flagged: false, threshold: 0.7 };

        }

    }

}

module.exports = new FraudService();