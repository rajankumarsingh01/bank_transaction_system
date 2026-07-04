import apiClient from "./client";

export const adminApi = {

    getFlaggedTransactions: (page = 1, limit = 20) =>
        apiClient.get(`/admin/transactions/flagged?page=${page}&limit=${limit}`).then((res) => res.data),

    getStats: () =>
        apiClient.get("/admin/stats").then((res) => res.data)

};