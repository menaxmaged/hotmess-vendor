import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import { getErrorMessage, tokenManager } from "../../lib/api-client";
import { authApi } from "./api";
import type { LoginResponse, VendorSignupRequest } from "./types";

type AuthUser = LoginResponse["user"];

const USER_KEY = "hotmess_user";

const hasWebStorage = () =>
  Platform.OS === "web" && typeof globalThis.localStorage !== "undefined";

const userCache = {
  get: async (): Promise<AuthUser | null> => {
    try {
      const raw = hasWebStorage()
        ? globalThis.localStorage.getItem(USER_KEY)
        : await SecureStore.getItemAsync(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  set: async (user: AuthUser) => {
    const serialized = JSON.stringify(user);
    if (hasWebStorage()) {
      globalThis.localStorage.setItem(USER_KEY, serialized);
    } else {
      await SecureStore.setItemAsync(USER_KEY, serialized);
    }
  },
  clear: async () => {
    if (hasWebStorage()) {
      globalThis.localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  },
};

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: VendorSignupRequest) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await tokenManager.get();
        if (!token) return;

        // Restore cached user immediately for fast startup
        const cached = await userCache.get();
        if (cached) setUser(cached);

        // Verify token with server and get fresh user
        const freshUser = await authApi.checkAuth();
        if (freshUser) {
          setUser(freshUser);
          await userCache.set(freshUser);
        } else {
          // Token is invalid — clear everything
          setUser(null);
          await Promise.all([tokenManager.remove(), userCache.clear()]);
        }
      } catch {
        setUser(null);
        await Promise.all([tokenManager.remove(), userCache.clear()]);
      } finally {
        setIsLoading(false);
      }
    };
    void initAuth();
  }, []);

  const login = (data: LoginResponse) => {
    setUser(data.user);
    void tokenManager.set(data.token ?? "");
    void userCache.set(data.user);
    router.replace("/(app)");
  };

  const logout = () => {
    // Revoke server-side too — best-effort, local sign-out proceeds regardless
    // of network state. (Previously nothing called authApi.logout(); the token
    // only ever cleared client-side.)
    void authApi.logout().catch(() => {});
    setUser(null);
    void tokenManager.remove();
    void userCache.clear();
    router.replace("/(auth)/login");
  };

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser);
    void userCache.set(updatedUser);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user?.accountType) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.accountType);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authApi.checkAuth();
      if (freshUser) {
        setUser(freshUser);
        await userCache.set(freshUser);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = response.token ?? (response as any).access_token;
      if (!response.user || !token) throw new Error("Invalid login response from server");
      login({ ...response, token });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (input: VendorSignupRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(input);
      if (!response.user || !response.token) throw new Error("Invalid signup response from server");
      login(response);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
        hasRole,
        signIn,
        signUp,
        signOut: logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
