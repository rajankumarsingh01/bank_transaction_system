const { z } = require("zod");

const updateStatusSchema = z.object({
    status: z.enum(
        [ "ACTIVE", "FROZEN", "CLOSED" ],
        { message: "Status must be ACTIVE, FROZEN or CLOSED" }
    )
});

module.exports = {
    updateStatusSchema
};