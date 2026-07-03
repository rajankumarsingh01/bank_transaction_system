import apiClient from "./client";

export const authApi = {

    register: (data) =>
        apiClient.post("/auth/register", data).then((res) => res.data),

    login: (data) =>
        apiClient.post("/auth/login", data).then((res) => res.data),

    logout: () =>
        apiClient.post("/auth/logout").then((res) => res.data)

};