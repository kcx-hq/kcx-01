import { create } from "zustand";
import axios from "axios";

type AuthUser = {
  full_name?: string;
  email?: string;
  role?: string;
  caps?: unknown;
  hasUploaded?: boolean;
};

type AuthStore = {
  user: AuthUser | null;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isVerifying: boolean;
  error: string | null;
  fetchUser: () => Promise<{ success: boolean; user?: AuthUser }>;
  updateProfile: (args: {
    full_name: string;
  }) => Promise<{ success: boolean; message?: string; user?: AuthUser }>;
  signUp: (payload: unknown) => Promise<{ success: boolean; message?: string }>;
  signIn: (args: {
    email: string;
    password: string;
  }) => Promise<{
    success: boolean;
    message?: string;
    hasUploaded?: boolean;
    status?: number;
    retryAfterSeconds?: number;
    blockedUntil?: string;
  }>;
  verifyEmail: (args: {
    email: string;
    otp: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL 
const CAPS_VERSION = "v1"; // bump when structure changes

interface AuthMessageResponse {
  message?: string;
}

interface UpdateProfileResponse extends AuthMessageResponse {
  user: AuthUser;
}

interface SignUpResponse extends AuthMessageResponse {
  user: AuthUser;
}

interface SignInResponse extends AuthMessageResponse {
  user?: AuthUser;
  hasUploaded?: boolean;
}

interface VerifyEmailResponse extends AuthMessageResponse {
  user: AuthUser;
}

interface AuthStore {
  user: AuthUser | null;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isVerifying: boolean;
  error: string | null;
  fetchUser: () => Promise<FetchUserResult>;
  updateProfile: (payload: UpdateProfileInput) => Promise<UpdateProfileResult>;
  signUp: (payload: SignupPayload) => Promise<SignUpResult>;
  signIn: (payload: LoginData) => Promise<SignInResult>;
  verifyEmail: (payload: VerifyEmailInput) => Promise<VerifyEmailResult>;
  logout: () => Promise<void>;
}

type AuthErrorContext = "signIn" | "signUp" | "verifyEmail" | "updateProfile";

const getAuthErrorMessage = (
  error: unknown,
  fallback: string,
  context: AuthErrorContext,
): string => {
  if (!isApiError(error)) {
    return getApiErrorMessage(error, fallback);
  }

  const status = error.status;
  const code = error.code;

  if (context === "signIn") {
    if (status === 401 || code === "UNAUTHENTICATED") {
      return "Invalid email or password.";
    }
    if (status === 403 || code === "UNAUTHORIZED") {
      return "Please verify your email before signing in.";
    }
    if (status === 429 || code === "RATE_LIMITED") {
      return "Too many attempts. Please try again in a few minutes.";
    }
  }

  if (context === "signUp") {
    if (status === 409 || code === "CONFLICT") {
      return "An account with this email already exists.";
    }
    if (status === 400 || code === "VALIDATION_ERROR") {
      return "Please check your details and try again.";
    }
  }

  if (context === "verifyEmail") {
    if (status === 400 || code === "VALIDATION_ERROR") {
      return "Invalid verification code. Please check and try again.";
    }
    if (status === 403 || code === "UNAUTHORIZED") {
      return "Verification failed. Please request a new code.";
    }
  }

  if (context === "updateProfile" && (status === 400 || code === "VALIDATION_ERROR")) {
    return "Please enter a valid full name.";
  }

  if ((status ?? 0) >= 500 || code === "INTERNAL") {
    return "Server error. Please try again in a moment.";
  }

  return getApiErrorMessage(error, fallback);
};

export const useAuthStore = create<AuthStore>((set) => ({
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

      const user = res.data as AuthUser;
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
    } catch {
      set({ user: null });
      localStorage.removeItem("capabilities");
      return { success: false };
    }
  },

  /* ================= UPDATE PROFILE ================= */
  updateProfile: async ({ full_name }: UpdateProfileInput) => {
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, { full_name });
      set({ user: res.data.user as AuthUser });
      return {
        success: true,
        message: res.data.message,
        user: res.data.user as AuthUser,
      };
    } catch (err) {
      const errorMessage =
        (err as any).response?.data?.message || "Failed to update profile";
      return { success: false, message: errorMessage };
    }
  },

  /* ================= SIGN UP ================= */
  signUp: async (payload: SignupPayload) => {
    set({ isSigningUp: true, error: null });

    try {
      const response = await apiPost<SignUpResponse>("/api/auth/signup", payload);

      set({
        user: res.data.user as AuthUser,
        isSigningUp: false,
      });

      return { success: true, message: response.message };
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "Signup failed", "signUp");
      set({
        isSigningUp: false,
        error:
          (err as any).response?.data?.message || "Signup failed",
      });

      return {
        success: false,
        message: (err as any).response?.data?.message,
      };
    }
  },

  /* ================= SIGN IN ================= */
  signIn: async ({ email, password }: LoginData) => {
    set({ isSigningIn: true, error: null });

    try {
      const signInResponse = await apiPost<SignInResponse>("/api/auth/signin", {
        email,
        password,
      });

      // After successful login, fetch full user data
      try {
        const user = await apiGet<AuthUser>("/api/auth/me");
        set({
          user: userRes.data as AuthUser,
          isSigningIn: false,
        });
        return {
          success: true,
          hasUploaded:
            Boolean(user.hasUploaded || signInResponse.hasUploaded),
        };
      } catch {
        // If /me fails, use the basic user data from signin
        set({
          user: res.data.user as AuthUser,
          isSigningIn: false,
        });
        return { success: true, hasUploaded: Boolean(signInResponse.hasUploaded) };
      }
    } catch (err) {
      const status = (err as any).response?.status;
      const retryAfterSeconds = (err as any).response?.data?.retry_after_seconds;
      const blockedUntil = (err as any).response?.data?.blocked_until;
      set({
        isSigningIn: false,
        error:
          (err as any).response?.data?.message || "Login failed",
      });

      return {
        success: false,
        message: (err as any).response?.data?.message,
        status,
        retryAfterSeconds,
        blockedUntil,
      };
    }
  },

  /* ================= VERIFY EMAIL ================= */
  verifyEmail: async ({ email, otp }: VerifyEmailInput) => {
    set({ isVerifying: true, error: null });

    try {
      const response = await apiPost<VerifyEmailResponse>("/api/auth/verify-email", {
        email,
        otp,
      });

      set({
        user: response.user,
        isVerifying: false,
      });

      return { success: true, message: response.message };
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "Verification failed", "verifyEmail");
      set({
        isVerifying: false,
        error:
          (err as any).response?.data?.message || "Verification failed",
      });

      return {
        success: false,
        message: (err as any).response?.data?.message,
      };
    }
  },

  /* ================= LOGOUT ================= */
  logout: async () => {
    try {
      await apiGet<void>("/api/auth/logout");
    } catch (err: unknown) {
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
