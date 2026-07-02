const express = require("express");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./shared/middleware/error.middleware");
const notFoundMiddleware = require("./shared/middleware/notFound.middleware");

const app = express();

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./modules/auth/auth.routes");
const accountRouter = require("./modules/accounts/account.routes");
const transactionRouter = require("./modules/transactions/transaction.routes");

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running");
});

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;