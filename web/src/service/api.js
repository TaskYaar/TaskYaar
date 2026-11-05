import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 15000 });

// Attach the login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`; // use `Token ${token}` if your Django uses DRF TokenAuth
  return config;
});

export default api;