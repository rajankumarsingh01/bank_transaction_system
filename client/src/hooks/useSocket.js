import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

export function useSocket() {

    const accessToken = useAuthStore((state) => state.accessToken);
    const queryClient = useQueryClient();
    const socketRef = useRef(null);

    useEffect(() => {

        if (!accessToken) return;

        const socket = io(SOCKET_URL, {
            auth: { token: accessToken },
            transports: ["websocket"]
        });

        socketRef.current = socket;

        socket.on("transaction:received", (data) => {

            toast.success(
                `💰 ${formatCurrency(data.amount)} received from ${data.senderName}`,
                { duration: 5000 }
            );

            queryClient.invalidateQueries({ queryKey: ["account"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });

        });

        socket.on("connect_error", (err) => {
            console.warn("Socket connection error:", err.message);
        });

        return () => {
            socket.disconnect();
        };

    }, [accessToken, queryClient]);

    return socketRef.current;

}