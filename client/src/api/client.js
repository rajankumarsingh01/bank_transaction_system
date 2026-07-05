import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true
});


apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let refreshQueue = [];

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {

        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/auth/refresh") &&
            !originalRequest.url.includes("/auth/login")
        ) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {

                const refreshToken = useAuthStore.getState().refreshToken;

               const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken
                });

                const newAccessToken = data.data.accessToken;
                const newRefreshToken = data.data.refreshToken;

                useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

                refreshQueue.forEach(({ resolve }) => resolve(newAccessToken));
                refreshQueue = [];

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);

            } catch (refreshError) {

                refreshQueue.forEach(({ reject }) => reject(refreshError));
                refreshQueue = [];

                useAuthStore.getState().logout();
                window.location.href = "/login";

                return Promise.reject(refreshError);

            } finally {
                isRefreshing = false;
            }

        }

        return Promise.reject(error);

    }
);

export default apiClient;