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

const historyQuerySchema = z.object({
    page: z
        .string()
        .regex(/^\d+$/, "page must be a number")
        .optional(),
    limit: z
        .string()
        .regex(/^\d+$/, "limit must be a number")
        .optional()
});

module.exports = {
    transferSchema,
    fundAccountSchema,
    historyQuerySchema
};