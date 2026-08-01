import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  try {
    const session = await getSession();
    const token = (session as any)?.accessToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Không có session hoặc lỗi khi lấy session - tiếp tục gửi request không có auth
  }
  return config;
});

export default api;
