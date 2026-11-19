import axios from "axios";
import { AUTH_TOKEN_STORAGE_KEY } from "../context/auth-context";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

export const API_ORIGIN = new URL(API_BASE_URL).origin;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
