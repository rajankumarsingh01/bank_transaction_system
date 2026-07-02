const { z } = require("zod");

const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid account ID format");

const transferSchema = z.object({
    fromAccount: objectId,
    toAccount: objectId,
    amount: z
        .number()
        .positive("Amount must be a positive number"),
    idempotencyKey: z
        .string()
        .min(1, "idempotencyKey is required")
}).refine(
    (data) => data.fromAccount !== data.toAccount,
    {
        message: "fromAccount and toAccount cannot be the same",
        path: [ "toAccount" ]
    }
);

const fundAccountSchema = z.object({
    toAccount: objectId,
    amount: z
        .number()
        .positive("Amount must be a positive number"),
    idempotencyKey: z
        .string()
        .min(1, "idempotencyKey is required")
});

module.exports = {
    transferSchema,
    fundAccountSchema
};