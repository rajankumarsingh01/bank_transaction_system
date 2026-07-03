const { MongoMemoryReplSet } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.ACCESS_TOKEN_SECRET = "test_access_secret_key_min_20_chars";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_key_min_20_chars";
process.env.ACCESS_TOKEN_EXPIRY = "15m";
process.env.REFRESH_TOKEN_EXPIRY = "7d";
process.env.EMAIL_USER = "test@example.com";
process.env.EMAIL_PASS = "test_pass";
process.env.CORS_ORIGIN = "http://localhost:5173";

let replSet;

beforeAll(async () => {

    replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1 }
    });

    const uri = replSet.getUri();
    process.env.MONGO_URI = uri;

    await mongoose.connect(uri);

}, 60000);

afterEach(async () => {

    const collections = mongoose.connection.collections;

    for (const key in collections) {
        await collections[ key ].deleteMany({});
    }

});

afterAll(async () => {

    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (replSet) {
        await replSet.stop();
    }

});

// Mock email service globally so tests don't try real SMTP calls
jest.mock("../src/modules/notifications/email.service", () => ({
    sendRegistrationEmail: jest.fn().mockResolvedValue(true),
    sendTransactionEmail: jest.fn().mockResolvedValue(true),
    sendTransactionFailureEmail: jest.fn().mockResolvedValue(true)
}));

// Mock BullMQ email queue so tests don't require a real Redis connection
jest.mock("../src/shared/queues/email.queue", () => ({
    enqueueTransactionEmail: jest.fn().mockResolvedValue(true),
    enqueueRegistrationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock Socket.IO manager so tests don't require a real socket server
jest.mock("../src/shared/socket/socket.manager", () => ({
    initSocket: jest.fn(),
    emitToUser: jest.fn()
}));