/**
 * Auth Feature Types
 */

// Register
export interface User {
  id: number | string;
  name: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN" | string;
  email: string;
  avatar_url?: string;
  avatarUrl?: string;
  phone?: string | null;
  timezone?: string;
  preferences?: any;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dialCode: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female";
  password: string;
}

export interface RegisterResponse {
  data?: string[];
  message_en?: string;
  message_ar?: string;
}

// OTP
export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

// Login
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  message_en?: string;
  message_ar?: string;
  user: User;
  token: string;
}

export interface CheckAuthResponse {
  authorized: boolean;
  user?: User;
  message?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface ResendOTPRequest {
  email: string;
}

export interface ResetPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  timezone?: string;
  avatar?: {
    uri: string;
    name: string;
    type: string;
  };
}
