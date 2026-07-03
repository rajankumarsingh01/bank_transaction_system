const { z } = require("zod");

const envSchema = z.object({
    PORT: z.string().optional(),
    NODE_ENV: z.enum([ "development", "production", "test" ]).default("development"),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    ACCESS_TOKEN_SECRET: z.string().min(20, "ACCESS_TOKEN_SECRET must be at least 20 characters"),
    REFRESH_TOKEN_SECRET: z.string().min(20, "REFRESH_TOKEN_SECRET must be at least 20 characters"),
    ACCESS_TOKEN_EXPIRY: z.string().optional(),
    REFRESH_TOKEN_EXPIRY: z.string().optional(),
    EMAIL_USER: z.string().min(1, "EMAIL_USER is required"),
    EMAIL_PASS: z.string().min(1, "EMAIL_PASS is required"),
    CORS_ORIGIN: z.string().optional()
});

function validateEnv() {

    const result = envSchema.safeParse(process.env);

    if (!result.success) {

        console.error("❌ Invalid or missing environment variables:");

        result.error.issues.forEach((issue) => {
            console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
        });

        process.exit(1);

    }

    console.log("✅ Environment variables validated");

    return result.data;

}

module.exports = validateEnv;