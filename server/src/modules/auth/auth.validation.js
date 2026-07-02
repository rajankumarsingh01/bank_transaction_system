const { z } = require("zod");

const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters"),

    email: z
        .string()
        .trim()
        .email("Invalid email address"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
});

module.exports = {
    registerSchema,
    loginSchema
};