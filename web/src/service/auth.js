import api from "./api.js";

// Demo mode is ON unless you set VITE_USE_MOCK=false in web/.env
export const MOCK = import.meta.env.VITE_USE_MOCK !== "false";
export const DEMO_OTP = "123456";

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const readUsers = () => {
  try { return JSON.parse(localStorage.getItem("mock:users") || "{}"); }
  catch { return {}; }
};

export async function sendOtp(phone) {
  if (MOCK) {
    await wait();
    return { ok: true };
  }
  const { data } = await api.post("/auth/send-otp/", { phone: "+91" + phone });
  return data;
}

// returns { token, user, isNew }
export async function verifyOtp(phone, otp) {
  if (MOCK) {
    await wait();
    if (otp !== DEMO_OTP) throw new Error("Incorrect code. Please try again.");
    const user = readUsers()[phone] || null;
    return { token: "mock-" + phone, user, isNew: !user };
  }
  const { data } = await api.post("/auth/verify-otp/", { phone: "+91" + phone, otp });
  return { token: data.token, user: data.user || null, isNew: Boolean(data.is_new) };
}

export async function registerUser(phone, profile) {
  if (MOCK) {
    await wait();
    const users = readUsers();
    const user = { phone, ...profile };
    users[phone] = user;
    localStorage.setItem("mock:users", JSON.stringify(users));
    return user;
  }
  const { data } = await api.post("/auth/register/", { phone: "+91" + phone, ...profile });
  return data.user || data;
}

export function errorMessage(err) {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}