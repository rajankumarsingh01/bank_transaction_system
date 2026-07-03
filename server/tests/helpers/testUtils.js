const request = require("supertest");
const app = require("../../src/app");
const userModel = require("../../src/modules/users/user.model");

async function registerUser(overrides = {}) {

    const payload = {
        name: "Test User",
        email: `user${Date.now()}${Math.random()}@test.com`,
        password: "123456",
        ...overrides
    };

    const res = await request(app)
        .post("/api/auth/register")
        .send(payload);

    return { res, payload };

}

async function loginUser(email, password) {

    return request(app)
        .post("/api/auth/login")
        .send({ email, password });

}

async function createAccount(token) {

    return request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send();

}

async function makeSystemUser(email) {

    return userModel.findOneAndUpdate(
        { email },
        { systemUser: true }
    );

}

async function registerAndSetupAccount(overrides = {}) {

    const { payload } = await registerUser(overrides);
    const loginRes = await loginUser(payload.email, payload.password);

    const token = loginRes.body.data.accessToken;
    const userId = loginRes.body.data.user._id;

    const accountRes = await createAccount(token);
    const accountId = accountRes.body.data._id;

    return { token, userId, accountId, email: payload.email, password: payload.password };

}

async function registerAndSetupSystemAccount() {

    const { payload } = await registerUser();
    await makeSystemUser(payload.email);

    const loginRes = await loginUser(payload.email, payload.password);
    const token = loginRes.body.data.accessToken;

    const accountRes = await createAccount(token);
    const accountId = accountRes.body.data._id;

    return { token, accountId, email: payload.email };

}

module.exports = {
    registerUser,
    loginUser,
    createAccount,
    makeSystemUser,
    registerAndSetupAccount,
    registerAndSetupSystemAccount
};