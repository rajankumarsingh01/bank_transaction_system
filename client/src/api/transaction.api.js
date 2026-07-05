import apiClient from "./client";

export const transactionApi = {

    transfer: (data) =>
        apiClient.post("/transactions", data).then((res) => res.data),

    getHistory: (page = 1, limit = 20) =>
        apiClient.get(`/transactions/me?page=${page}&limit=${limit}`).then((res) => res.data),

   reverse: (transactionId) =>
        apiClient.post(`/transactions/${transactionId}/reverse`).then((res) => res.data),

    getAnalytics: (days = 30) =>
        apiClient.get(`/transactions/me/analytics?days=${days}`).then((res) => res.data),

    fundAccount: (data) =>
        apiClient.post("/transactions/system/initial-funds", data).then((res) => res.data)

};