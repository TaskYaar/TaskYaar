import api from "./api.js";

// Demo mode is ON unless web/.env has VITE_USE_MOCK=false
export const MOCK = import.meta.env.VITE_USE_MOCK !== "false";
export const DEMO_OTP = "123456";

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const readUsers = () => {
  try { return JSON.parse(localStorage.getItem("mock:users") || "{}"); }
  catch { return {}; }
};

// The API uses full_name; the app uses name.
const toFrontUser = (u) =>
  u && { id: u.id, phone: u.phone, name: u.full_name, email: u.email, city: u.city, role: u.role };

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
  localStorage.setItem("refresh", data.refresh);
  return { token: data.access, user: toFrontUser(data.user), isNew: Boolean(data.is_new) };
}

// Completes the profile of a user who just verified their phone.
export async function registerUser(phone, profile) {
  if (MOCK) {
    await wait();
    const users = readUsers();
    const user = { phone, ...profile };
    users[phone] = user;
    localStorage.setItem("mock:users", JSON.stringify(users));
    return user;
  }
  const { data } = await api.patch("/users/me/", {
    full_name: profile.name,
    email: profile.email,
    city: profile.city,
    role: profile.role,
    accept_terms: true,
  });
  return toFrontUser(data);
}

// Google sign-in is not part of the MVP backend. These stay exported so existing
// imports (Register.jsx, GoogleButton) keep working, but they fail with a clear message.
const GOOGLE_UNAVAILABLE = "Google sign-in is not available yet. Please use your phone number.";

export async function googleLogin() {
  throw new Error(GOOGLE_UNAVAILABLE);
}

export async function googleRegister() {
  throw new Error(GOOGLE_UNAVAILABLE);
}

export function errorMessage(err) {
  const d = err?.response?.data;
  if (typeof d?.detail === "string") return d.detail;
  if (typeof d?.message === "string") return d.message;
  if (d && typeof d === "object") {
    const first = Object.values(d)[0];
    const text = Array.isArray(first) ? first[0] : first;
    if (typeof text === "string") return text;
  }
  if (err?.response?.status === 404 || err?.code === "ERR_NETWORK") {
    return "Can't reach the server. Is the backend running?";
  }
  return err?.message || "Something went wrong. Please try again.";
}