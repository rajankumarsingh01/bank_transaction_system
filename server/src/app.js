const express = require("express")
const cookieParser = require("cookie-parser")


const app = express()


app.use(express.json())
app.use(cookieParser())

const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    })
})

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err)
    res.status(err.status || 500).json({
        message: err.message || "Something went wrong on the server"
    })
})

module.exports = app