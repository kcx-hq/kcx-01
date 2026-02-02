import { create } from "zustand";
import axios from "axios";

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL || "https://master-01-backend.onrender.com";
const CAPS_VERSION = "v1"; // bump when structure changes
const CAPS_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const useAuthStore = create((set) => ({
  user: null,

  isSigningIn: false,
  isSigningUp: false,
  isVerifying: false,

  error: null,

  /* ================= FETCH USER ================= */
  fetchUser: async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });

      const user = res.data;
      set({ user });

      if (user?.caps) {
        localStorage.setItem(
          "capabilities",
          JSON.stringify({
            version: CAPS_VERSION,
            cachedAt: Date.now(),
            value: user.caps,
          }),
        );
      }

      return { success: true, user };
    } catch (err) {
      set({ user: null });
      localStorage.removeItem("capabilities");
      return { success: false };
    }
  },

  /* ================= UPDATE PROFILE ================= */
  updateProfile: async ({ full_name }) => {
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, { full_name });
      set({ user: res.data.user });
      return { success: true, message: res.data.message, user: res.data.user };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update profile";
      return { success: false, message: errorMessage };
    }
  },

  /* ================= SIGN UP ================= */
  signUp: async (payload) => {
    set({ isSigningUp: true, error: null });

    try {
      const res = await axios.post(`${API_URL}/api/auth/signup`, payload);

      set({
        user: res.data.user,
        isSigningUp: false,
      });

      return { success: true, message: res.data.message };
    } catch (err) {
      set({
        isSigningUp: false,
        error: err.response?.data?.message || "Signup failed",
      });

      return { success: false, message: err.response?.data?.message };
    }
  },

  /* ================= SIGN IN ================= */
  signIn: async ({ email, password }) => {
    set({ isSigningIn: true, error: null });

    try {
      const res = await axios.post(`${API_URL}/api/auth/signin`, {
        email,
        password,
      });

      // After successful login, fetch full user data
      try {
        const userRes = await axios.get(`${API_URL}/api/auth/me`);
        set({
          user: userRes.data,
          isSigningIn: false,
        });
        return {
          success: true,
          hasUploaded:
            userRes.data.hasUploaded || res.data.hasUploaded || false,
        };
      } catch (userErr) {
        // If /me fails, use the basic user data from signin
        set({
          user: res.data.user,
          isSigningIn: false,
        });
        return { success: true, hasUploaded: res.data.hasUploaded || false };
      }
    } catch (err) {
      set({
        isSigningIn: false,
        error: err.response?.data?.message || "Login failed",
      });

      return { success: false, message: err.response?.data?.message };
    }
  },

  /* ================= VERIFY EMAIL ================= */
  verifyEmail: async ({ email, otp }) => {
    set({ isVerifying: true, error: null });

    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-email`, {
        email,
        otp,
      });

      set({
        user: res.data.user,
        isVerifying: false,
      });

      return { success: true, message: res.data.message };
    } catch (err) {
      set({
        isVerifying: false,
        error: err.response?.data?.message || "Verification failed",
      });

      return { success: false, message: err.response?.data?.message };
    }
  },

  /* ================= LOGOUT ================= */
  logout: async () => {
    try {
      await axios.get(`${API_URL}/api/auth/logout`);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear user state
      set({
        user: null,
      });
      // Clear localStorage data (saved views can be kept, but CSV data is no longer stored)
      // localStorage.removeItem('finops_saved_views'); // Optional: keep user preferences
    }
  },
}));
