import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

let cachedToken: string | null = null;
let tokenExpiry = 0;

api.interceptors.request.use(async (config) => {
  try {
    const now = Date.now();
    // Cache session token for 10 seconds to avoid hitting /api/auth/session repeatedly on parallel requests
    if (!cachedToken || now > tokenExpiry) {
      const session = await getSession().catch(() => null);
      cachedToken = (session as any)?.accessToken || null;
      tokenExpiry = now + 10000;
    }

    if (cachedToken) {
      config.headers.Authorization = `Bearer ${cachedToken}`;
    }
  } catch (e) {
    // Ignore error silently to ensure API request proceeds
  }
  return config;
});

export function setMemoryAccessToken(token: string | null, _user?: any) {
  cachedToken = token;
  tokenExpiry = Date.now() + 3600000;
}

export function getMemoryAccessToken(): string | null {
  return cachedToken;
}

export function clearMemoryAuth() {
  cachedToken = null;
  tokenExpiry = 0;
}

export function broadcastSessionEvent(event: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("session_event", { detail: { event } }));
  }
}

export default api;
