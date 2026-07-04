const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");

const errorMiddleware = require("./shared/middleware/error.middleware");
const notFoundMiddleware = require("./shared/middleware/notFound.middleware");
const { generalLimiter } = require("./shared/middleware/rateLimiter.middleware");
const requestLogger = require("./shared/logger/requestLogger.middleware");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./shared/swagger/swagger.config");

const app = express();

app.use(requestLogger);

app.use(helmet());

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);

const authRouter = require("./modules/auth/auth.routes");
const accountRouter = require("./modules/accounts/account.routes");
const transactionRouter = require("./modules/transactions/transaction.routes");
const adminRouter = require("./modules/admin/admin.routes");
const scheduledPaymentRouter = require("./modules/transactions/scheduledPayment.routes");

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/scheduled-payments", scheduledPaymentRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;