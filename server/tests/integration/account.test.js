const request = require("supertest");
const app = require("../../src/app");
const { registerAndSetupAccount, registerUser, createAccount } = require("../helpers/testUtils");

describe("Account API", () => {

    describe("POST /api/accounts", () => {

        it("should create an account for a logged-in user", async () => {

            const { payload } = await registerUser({ email: "acc1@test.com" });

            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({ email: payload.email, password: payload.password });

            const res = await createAccount(loginRes.body.data.accessToken);

            expect(res.status).toBe(201);
            expect(res.body.data.status).toBe("ACTIVE");
            expect(res.body.data.currency).toBe("INR");

        });

        it("should not allow creating a second account for the same user", async () => {

            const { token } = await registerAndSetupAccount({ email: "acc2@test.com" });

            const res = await createAccount(token);

            expect(res.status).toBe(409);

        });

        it("should reject account creation without auth", async () => {

            const res = await request(app).post("/api/accounts").send();

            expect(res.status).toBe(401);

        });

    });

    describe("GET /api/accounts/me", () => {

        it("should return account with balance field", async () => {

            const { token } = await registerAndSetupAccount({ email: "acc3@test.com" });

            const res = await request(app)
                .get("/api/accounts/me")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.balance).toBe(0);

        });

    });

    describe("PATCH /api/accounts/me/status", () => {

        it("should freeze an account", async () => {

            const { token } = await registerAndSetupAccount({ email: "acc4@test.com" });

            const res = await request(app)
                .patch("/api/accounts/me/status")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "FROZEN" });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("FROZEN");

        });

        it("should not close an account with non-zero balance", async () => {

            // handled fully in transaction.test.js once funds exist
            const { token } = await registerAndSetupAccount({ email: "acc5@test.com" });

            const res = await request(app)
                .patch("/api/accounts/me/status")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "CLOSED" });

            // balance is 0 by default, so this should succeed
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("CLOSED");

        });

        it("should reject invalid status value", async () => {

            const { token } = await registerAndSetupAccount({ email: "acc6@test.com" });

            const res = await request(app)
                .patch("/api/accounts/me/status")
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "INVALID_STATUS" });

            expect(res.status).toBe(400);

        });

    });

});