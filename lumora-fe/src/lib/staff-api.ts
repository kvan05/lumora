import axios from "axios";
import { getStaffToken } from "./staff-auth";

const staffApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

staffApi.interceptors.request.use((config) => {
  const token = getStaffToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default staffApi;
