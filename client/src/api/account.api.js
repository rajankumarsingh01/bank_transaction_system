import apiClient from "./client";

export const accountApi = {

    create: () =>
        apiClient.post("/accounts").then((res) => res.data),

    getMe: () =>
        apiClient.get("/accounts/me").then((res) => res.data),

    updateStatus: (status) =>
        apiClient.patch("/accounts/me/status", { status }).then((res) => res.data)

};