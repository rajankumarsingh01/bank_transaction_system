const request = require("supertest");
const app = require("../../src/app");
const {
    registerAndSetupAccount,
    registerAndSetupSystemAccount
} = require("../helpers/testUtils");

describe("Transaction API", () => {

    describe("POST /api/transactions/system/initial-funds", () => {

        it("should fund a user account from the system account", async () => {

            const system = await registerAndSetupSystemAccount();
            const user = await registerAndSetupAccount({ email: "fund1@test.com" });

            const res = await request(app)
                .post("/api/transactions/system/initial-funds")
                .set("Authorization", `Bearer ${system.token}`)
                .send({
                    toAccount: user.accountId,
                    amount: 5000,
                    idempotencyKey: `fund-${Date.now()}`
                });

            expect(res.status).toBe(201);
            expect(res.body.data.status).toBe("COMPLETED");

            const balanceRes = await request(app)
                .get("/api/accounts/me")
                .set("Authorization", `Bearer ${user.token}`);

            expect(balanceRes.body.data.balance).toBe(5000);

        });

        it("should reject funding from a non-system user", async () => {

            const nonSystem = await registerAndSetupAccount({ email: "notsystem@test.com" });
            const receiver = await registerAndSetupAccount({ email: "fund2@test.com" });

            const res = await request(app)
                .post("/api/transactions/system/initial-funds")
                .set("Authorization", `Bearer ${nonSystem.token}`)
                .send({
                    toAccount: receiver.accountId,
                    amount: 1000,
                    idempotencyKey: `fund-${Date.now()}`
                });

            expect(res.status).toBe(403);

        });

        it("should not double-process the same idempotency key", async () => {

            const system = await registerAndSetupSystemAccount();
            const user = await registerAndSetupAccount({ email: "fund3@test.com" });

            const key = `fund-fixed-${Date.now()}`;

            const first = await request(app)
                .post("/api/transactions/system/initial-funds")
                .set("Authorization", `Bearer ${system.token}`)
                .send({ toAccount: user.accountId, amount: 1000, idempotencyKey: key });

            expect(first.status).toBe(201);

            const second = await request(app)
                .post("/api/transactions/system/initial-funds")
                .set("Authorization", `Bearer ${system.token}`)
                .send({ toAccount: user.accountId, amount: 1000, idempotencyKey: key });

            expect(second.status).toBe(409);

            const balanceRes = await request(app)
                .get("/api/accounts/me")
                .set("Authorization", `Bearer ${user.token}`);

            expect(balanceRes.body.data.balance).toBe(1000);

        });

    });

    describe("POST /api/transactions", () => {

        async function fundUser(systemToken, accountId, amount) {

            return request(app)
                .post("/api/transactions/system/initial-funds")
                .set("Authorization", `Bearer ${systemToken}`)
                .send({
                    toAccount: accountId,
                    amount,
                    idempotencyKey: `fund-${accountId}-${Date.now()}-${Math.random()}`
                });

        }

        it("should transfer funds between two active accounts", async () => {

            const system = await registerAndSetupSystemAccount();
            const sender = await registerAndSetupAccount({ email: "sender1@test.com" });
            const receiver = await registerAndSetupAccount({ email: "receiver1@test.com" });

            await fundUser(system.token, sender.accountId, 5000);

            const res = await request(app)
                .post("/api/transactions")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    fromAccount: sender.accountId,
                    toAccount: receiver.accountId,
                    amount: 1500,
                    idempotencyKey: `transfer-${Date.now()}`
                });

            expect(res.status).toBe(201);
            expect(res.body.data.status).toBe("COMPLETED");

            const senderBalance = await request(app)
                .get("/api/accounts/me")
                .set("Authorization", `Bearer ${sender.token}`);

            const receiverBalance = await request(app)
                .get("/api/accounts/me")
                .set("Authorization", `Bearer ${receiver.token}`);

            expect(senderBalance.body.data.balance).toBe(3500);
            expect(receiverBalance.body.data.balance).toBe(1500);

        });

        it("should reject transfer with insufficient balance", async () => {

            const sender = await registerAndSetupAccount({ email: "sender2@test.com" });
            const receiver = await registerAndSetupAccount({ email: "receiver2@test.com" });

            const res = await request(app)
                .post("/api/transactions")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    fromAccount: sender.accountId,
                    toAccount: receiver.accountId,
                    amount: 100,
                    idempotencyKey: `transfer-${Date.now()}`
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Insufficient balance/i);

        });

        it("should reject transfer to the same account", async () => {

            const sender = await registerAndSetupAccount({ email: "sender3@test.com" });

            const res = await request(app)
                .post("/api/transactions")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    fromAccount: sender.accountId,
                    toAccount: sender.accountId,
                    amount: 100,
                    idempotencyKey: `transfer-${Date.now()}`
                });

            expect(res.status).toBe(400);

        });

        it("should reject transfer from someone else's account", async () => {

            const system = await registerAndSetupSystemAccount();
            const owner = await registerAndSetupAccount({ email: "owner1@test.com" });
            const attacker = await registerAndSetupAccount({ email: "attacker1@test.com" });
            const receiver = await registerAndSetupAccount({ email: "receiver3@test.com" });

            await fundUser(system.token, owner.accountId, 5000);

            const res = await request(app)
                .post("/api/transactions")
                .set("Authorization", `Bearer ${attacker.token}`)
                .send({
                    fromAccount: owner.accountId,
                    toAccount: receiver.accountId,
                    amount: 100,
                    idempotencyKey: `transfer-${Date.now()}`
                });

            expect([ 400, 403 ]).toContain(res.status);

        });

    });

    describe("POST /api/transactions/:id/reverse", () => {

        it("should reverse a completed transaction", async () => {

            const system = await registerAndSetupSystemAccount();
            const sender = await registerAndSetupAccount({ email: "rev1@test.com" });
            const receiver = await registerAndSetupAccount({ email: "rev2@test.com" });

            await request(app)
                .post("/api/transactions/system/initial-funds")
                .set("Authorization", `Bearer ${system.token}`)
                .send({
                    toAccount: sender.accountId,
                    amount: 5000,
                    idempotencyKey: `fund-${Date.now()}`
                });

            const transferRes = await request(app)
                .post("/api/transactions")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    fromAccount: sender.accountId,
                    toAccount: receiver.accountId,
                    amount: 1500,
                    idempotencyKey: `transfer-${Date.now()}`
                });

            const transactionId = transferRes.body.data._id;

            const reverseRes = await request(app)
                .post(`/api/transactions/${transactionId}/reverse`)
                .set("Authorization", `Bearer ${sender.token}`);

            expect(reverseRes.status).toBe(201);

            const senderBalance = await request(app)
                .get("/api/accounts/me")
                .set("Authorization", `Bearer ${sender.token}`);

            const receiverBalance = await request(app)
                .get("/api/accounts/me")
                .set("Authorization", `Bearer ${receiver.token}`);

            expect(senderBalance.body.data.balance).toBe(5000);
            expect(receiverBalance.body.data.balance).toBe(0);

        });

        it("should not reverse the same transaction twice", async () => {

            const system = await registerAndSetupSystemAccount();
            const sender = await registerAndSetupAccount({ email: "rev3@test.com" });
            const receiver = await registerAndSetupAccount({ email: "rev4@test.com" });

            await request(app)
                .post("/api/transactions/system/initial-funds")
                .set("Authorization", `Bearer ${system.token}`)
                .send({
                    toAccount: sender.accountId,
                    amount: 5000,
                    idempotencyKey: `fund-${Date.now()}`
                });

            const transferRes = await request(app)
                .post("/api/transactions")
                .set("Authorization", `Bearer ${sender.token}`)
                .send({
                    fromAccount: sender.accountId,
                    toAccount: receiver.accountId,
                    amount: 1000,
                    idempotencyKey: `transfer-${Date.now()}`
                });

            const transactionId = transferRes.body.data._id;

            await request(app)
                .post(`/api/transactions/${transactionId}/reverse`)
                .set("Authorization", `Bearer ${sender.token}`);

            const secondReverse = await request(app)
                .post(`/api/transactions/${transactionId}/reverse`)
                .set("Authorization", `Bearer ${sender.token}`);

            expect(secondReverse.status).toBe(409);

        });

    });

    describe("GET /api/transactions/me", () => {

        it("should return paginated transaction history", async () => {

            const system = await registerAndSetupSystemAccount();
            const user = await registerAndSetupAccount({ email: "hist1@test.com" });

            await request(app)
                .post("/api/transactions/system/initial-funds")
                .set("Authorization", `Bearer ${system.token}`)
                .send({
                    toAccount: user.accountId,
                    amount: 1000,
                    idempotencyKey: `fund-${Date.now()}`
                });

            const res = await request(app)
                .get("/api/transactions/me?page=1&limit=10")
                .set("Authorization", `Bearer ${user.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.transactions.length).toBe(1);
            expect(res.body.data.pagination.total).toBe(1);

        });

    });

});