const request = require("supertest");
const app = require("../../src/app");
const { registerUser } = require("../helpers/testUtils");

describe("Auth API", () => {

    describe("POST /api/auth/register", () => {

        it("should register a new user and return tokens", async () => {

            const { res } = await registerUser({ email: "newuser@test.com" });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe("newuser@test.com");
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();

        });

        it("should not allow duplicate email registration", async () => {

            await registerUser({ email: "dupe@test.com" });
            const { res } = await registerUser({ email: "dupe@test.com" });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);

        });

        it("should reject weak password", async () => {

            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test",
                    email: "weak@test.com",
                    password: "123"
                });

            expect(res.status).toBe(400);

        });

    });

    describe("POST /api/auth/login", () => {

        it("should login with correct credentials", async () => {

            const { payload } = await registerUser({ email: "login@test.com" });

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: payload.email, password: payload.password });

            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();

        });

        it("should reject wrong password", async () => {

            const { payload } = await registerUser({ email: "wrongpass@test.com" });

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: payload.email, password: "wrongpassword" });

            expect(res.status).toBe(401);

        });

    });

    describe("POST /api/auth/refresh", () => {

        it("should issue new tokens with a valid refresh token", async () => {

            const { payload } = await registerUser({ email: "refresh@test.com" });

            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({ email: payload.email, password: payload.password });

            const oldRefreshToken = loginRes.body.data.refreshToken;

            const res = await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken: oldRefreshToken });

            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).not.toBe(oldRefreshToken);

        });

        it("should reject a reused (rotated) refresh token", async () => {

            const { payload } = await registerUser({ email: "reuse@test.com" });

            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({ email: payload.email, password: payload.password });

            const oldRefreshToken = loginRes.body.data.refreshToken;

            await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken: oldRefreshToken });

            const secondAttempt = await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken: oldRefreshToken });

            expect(secondAttempt.status).toBe(401);

        });

    });

    describe("POST /api/auth/logout", () => {

        it("should blacklist the access token on logout", async () => {

            const { payload } = await registerUser({ email: "logout@test.com" });

            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({ email: payload.email, password: payload.password });

            const token = loginRes.body.data.accessToken;

            const logoutRes = await request(app)
                .post("/api/auth/logout")
                .set("Authorization", `Bearer ${token}`);

            expect(logoutRes.status).toBe(200);

            const protectedRes = await request(app)
                .get("/api/accounts/me")
                .set("Authorization", `Bearer ${token}`);

            expect(protectedRes.status).toBe(401);

        });

    });

});