import { create } from "zustand";
import { apiGet, apiPost, apiPut } from "../services/http";
import { getApiErrorMessage, isApiError } from "../services/apiError";
import type {
  AuthUser,
  FetchUserResult,
  LoginData,
  SignInResult,
  SignUpResult,
  SignupPayload,
  UpdateProfileInput,
  UpdateProfileResult,
  VerifyEmailInput,
  VerifyEmailResult,
} from "../shared/auth/types";
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
      const user = await apiGet<AuthUser>("/api/auth/me");
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
      const response = await apiPut<UpdateProfileResponse>("/api/auth/profile", { full_name });
      set({ user: response.user });
      return { success: true, message: response.message, user: response.user };
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "Failed to update profile", "updateProfile");
      return { success: false, message: errorMessage };
    }
  },

  /* ================= SIGN UP ================= */
  signUp: async (payload: SignupPayload) => {
    set({ isSigningUp: true, error: null });

    try {
      const response = await apiPost<SignUpResponse>("/api/auth/signup", payload);

      set({
        user: response.user,
        isSigningUp: false,
      });

      return { success: true, message: response.message };
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "Signup failed", "signUp");
      set({
        isSigningUp: false,
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        status: isApiError(err) ? err.status : undefined,
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
          user,
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
          user: signInResponse.user ?? null,
          isSigningIn: false,
        });
        return { success: true, hasUploaded: Boolean(signInResponse.hasUploaded) };
      }
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "Login failed", "signIn");
      set({
        isSigningIn: false,
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        status: isApiError(err) ? err.status : undefined,
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
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        status: isApiError(err) ? err.status : undefined,
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
