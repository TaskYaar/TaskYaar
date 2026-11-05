import api from "./api.js";

// Demo mode is ON unless web/.env has VITE_USE_MOCK=false
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
  localStorage.setItem("refresh", data.refresh);
  return { token: data.access, user: data.user || null, isNew: Boolean(data.is_new) };
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
  const { data } = await api.post("/auth/register/", profile);
  return data.user;
}

// Existing Google user -> { token, user }. New Google user -> { signupToken, google }.
export async function googleLogin(credential) {
  if (MOCK) {
    throw new Error("Google sign-in needs the real backend. Set VITE_USE_MOCK=false in web/.env.");
  }
  const { data } = await api.post("/auth/google/", { credential });
  if (data.signup_token) {
    return { signupToken: data.signup_token, google: data.google };
  }
  localStorage.setItem("refresh", data.refresh);
  return { token: data.access, user: data.user || null };
}

export async function googleRegister(signupToken, profile) {
  const { data } = await api.post("/auth/google-register/", { signup_token: signupToken, ...profile });
  localStorage.setItem("refresh", data.refresh);
  return { token: data.access, user: data.user };
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
