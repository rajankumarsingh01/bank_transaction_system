const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../logger/logger");

let io = null;

// Maps userId -> Set of socket IDs (a user could have multiple tabs/devices open)
const userSockets = new Map();

function initSocket(httpServer) {

    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
            credentials: true
        }
    });

    io.use((socket, next) => {

        try {

            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication token missing"));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            socket.userId = decoded.userId;

            next();

        } catch (err) {
            next(new Error("Invalid or expired token"));
        }

    });

    io.on("connection", (socket) => {

        const userId = socket.userId;

        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        logger.info({ userId, socketId: socket.id }, "Socket connected");

        socket.on("disconnect", () => {
            userSockets.get(userId)?.delete(socket.id);
            if (userSockets.get(userId)?.size === 0) {
                userSockets.delete(userId);
            }
            logger.info({ userId, socketId: socket.id }, "Socket disconnected");
        });

    });

    return io;

}

function emitToUser(userId, event, payload) {

    if (!io) return;

    const socketIds = userSockets.get(userId.toString());

    if (!socketIds || socketIds.size === 0) {
        return; // user not currently connected — no-op, not an error
    }

    for (const socketId of socketIds) {
        io.to(socketId).emit(event, payload);
    }

}

module.exports = { initSocket, emitToUser };