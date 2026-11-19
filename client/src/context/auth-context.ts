import { createContext } from "react";
import type { AuthUser } from "../schemas/auth.schema";

export const AUTH_TOKEN_STORAGE_KEY = "kopora.accessToken";

export type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isInitializing: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);