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

const CAPS_VERSION = "v1";

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

interface SignInLockoutMeta {
  retryAfterSeconds?: number;
  blockedUntil?: string;
}

type SignInResultWithLockout = SignInResult & SignInLockoutMeta;

interface AuthStore {
  user: AuthUser | null;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isVerifying: boolean;
  error: string | null;
  fetchUser: () => Promise<FetchUserResult>;
  updateProfile: (payload: UpdateProfileInput) => Promise<UpdateProfileResult>;
  signUp: (payload: SignupPayload) => Promise<SignUpResult>;
  signIn: (payload: LoginData) => Promise<SignInResultWithLockout>;
  verifyEmail: (payload: VerifyEmailInput) => Promise<VerifyEmailResult>;
  logout: () => Promise<void>;
}

type AuthErrorContext = "signIn" | "signUp" | "verifyEmail" | "updateProfile";

type SignupRequestPayload = Omit<SignupPayload, "client_name" | "client_email"> & {
  client_name?: string;
  client_email?: string;
};

const normalizeOptionalSignupField = (value: string | undefined): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed !== "" ? trimmed : undefined;
};

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

const getLockoutMeta = (error: unknown): SignInLockoutMeta => {
  if (!isApiError(error)) return {};

  const details =
    typeof error.details === "object" && error.details !== null
      ? (error.details as Record<string, unknown>)
      : null;
  if (!details) return {};

  const retryAfterRaw = details["retry_after_seconds"];
  const blockedUntilRaw = details["blocked_until"];

  const retryAfterSeconds = Number.isFinite(Number(retryAfterRaw))
    ? Number(retryAfterRaw)
    : undefined;
  const blockedUntil =
    typeof blockedUntilRaw === "string" && blockedUntilRaw.trim() !== ""
      ? blockedUntilRaw
      : undefined;

  const result: SignInLockoutMeta = {};
  if (typeof retryAfterSeconds === "number") {
    result.retryAfterSeconds = retryAfterSeconds;
  }
  if (typeof blockedUntil === "string") {
    result.blockedUntil = blockedUntil;
  }
  return result;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isSigningIn: false,
  isSigningUp: false,
  isVerifying: false,
  error: null,

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

  signUp: async (payload: SignupPayload) => {
    set({ isSigningUp: true, error: null });

    try {
      const requestPayload: SignupRequestPayload = {
        full_name: payload.full_name.trim(),
        email: payload.email.trim(),
        password: payload.password,
        role: payload.role.trim(),
      };

      const normalizedClientName = normalizeOptionalSignupField(payload.client_name);
      const normalizedClientEmail = normalizeOptionalSignupField(payload.client_email);

      if (normalizedClientName) {
        requestPayload.client_name = normalizedClientName;
      }

      if (normalizedClientEmail) {
        requestPayload.client_email = normalizedClientEmail;
      }

      const response = await apiPost<SignUpResponse>("/api/auth/signup", requestPayload);
      set({ user: response.user, isSigningUp: false });
      return { success: true, message: response.message };
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "Signup failed", "signUp");
      set({ isSigningUp: false, error: errorMessage });
      return {
        success: false,
        message: errorMessage,
        status: isApiError(err) ? err.status : undefined,
      };
    }
  },

  signIn: async ({ email, password }: LoginData) => {
    set({ isSigningIn: true, error: null });

    try {
      const signInResponse = await apiPost<SignInResponse>("/api/auth/signin", {
        email,
        password,
      });

      try {
        const user = await apiGet<AuthUser>("/api/auth/me");
        set({ user, isSigningIn: false });
        return {
          success: true,
          hasUploaded: Boolean(user.hasUploaded || signInResponse.hasUploaded),
        };
      } catch {
        set({ user: signInResponse.user ?? null, isSigningIn: false });
        return {
          success: true,
          hasUploaded: Boolean(signInResponse.hasUploaded),
        };
      }
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "Login failed", "signIn");
      const lockoutMeta = getLockoutMeta(err);
      set({ isSigningIn: false, error: errorMessage });
      const result: SignInResultWithLockout = {
        success: false,
        message: errorMessage,
        status: isApiError(err) ? err.status : undefined,
      };
      if (typeof lockoutMeta.retryAfterSeconds === "number") {
        result.retryAfterSeconds = lockoutMeta.retryAfterSeconds;
      }
      if (typeof lockoutMeta.blockedUntil === "string") {
        result.blockedUntil = lockoutMeta.blockedUntil;
      }
      return result;
    }
  },

  verifyEmail: async ({ email, otp }: VerifyEmailInput) => {
    set({ isVerifying: true, error: null });

    try {
      const response = await apiPost<VerifyEmailResponse>("/api/auth/verify-email", {
        email,
        otp,
      });

      set({ user: response.user, isVerifying: false });
      return { success: true, message: response.message };
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "Verification failed", "verifyEmail");
      set({ isVerifying: false, error: errorMessage });
      return {
        success: false,
        message: errorMessage,
        status: isApiError(err) ? err.status : undefined,
      };
    }
  },

  logout: async () => {
    try {
      await apiGet<void>("/api/auth/logout");
    } catch {
      // no-op: local auth state is cleared regardless of network logout status
    } finally {
      set({ user: null });
    }
  },
}));
