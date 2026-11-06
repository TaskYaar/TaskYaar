import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

// If a request fails with 401, get a new access token once and retry the request.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const refresh = localStorage.getItem("refresh");
    const isAuthCall = original?.url?.startsWith("/auth/");

    if (error.response?.status === 401 && refresh && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post("/api/auth/refresh/", { refresh }).finally(() => {
            refreshing = null;
          });
        const { data } = await refreshing;
        localStorage.setItem("token", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;