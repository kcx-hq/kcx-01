export type AuthView = "login" | "signup" | "verify";

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  companyName: string;
  companyEmail: string;
}

export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
  role: string;
  client_name: string;
  client_email: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface UpdateProfileInput {
  full_name: string;
}

export interface AuthUser {
  email?: string;
  full_name?: string;
  role?: string;
  caps?: unknown;
  is_premium?: boolean;
  hasUploaded?: boolean;
  [key: string]: unknown;
}

export interface AuthActionResult {
  success: boolean;
  message?: string | undefined;
  status?: number | undefined;
}

export interface FetchUserResult extends AuthActionResult {
  user?: AuthUser | undefined;
}

export interface UpdateProfileResult extends AuthActionResult {
  user?: AuthUser | undefined;
}

export type SignUpResult = AuthActionResult;

export interface SignInResult extends AuthActionResult {
  hasUploaded?: boolean | undefined;
}

export type VerifyEmailResult = AuthActionResult;
