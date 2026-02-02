import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://master-01-backend.onrender.com",
  withCredentials: true,
});

