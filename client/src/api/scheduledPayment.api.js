import apiClient from "./client";

export const scheduledPaymentApi = {

    create: (data) =>
        apiClient.post("/scheduled-payments", data).then((res) => res.data),

    list: () =>
        apiClient.get("/scheduled-payments").then((res) => res.data),

    cancel: (id) =>
        apiClient.post(`/scheduled-payments/${id}/cancel`).then((res) => res.data)

};