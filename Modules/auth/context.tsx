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
import type { LoginResponse } from "./types";

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
  signUp: (name: string, email: string, password: string) => Promise<void>;
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
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
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

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const [firstName, ...rest] = name.trim().split(" ");
      await authApi.register({
        firstName: firstName || "User",
        lastName: rest.join(" ") || "User",
        email,
        countryCode: "US",
        dialCode: "+1",
        phone: "0000000000",
        dateOfBirth: "1990-01-01",
        gender: "male",
        password,
      });
      await signIn(email, password);
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
