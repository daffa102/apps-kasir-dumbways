import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io } from "socket.io-client";
import { api, API_ORIGIN } from "../lib/api";
import {
  authMeResponseSchema,
  type AuthUser,
} from "../schemas/auth.schema";
import { AUTH_TOKEN_STORAGE_KEY, AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  );
  const startupToken = useRef(token);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(Boolean(token));

  useEffect(() => {
    const tokenToVerify = startupToken.current;
    if (!tokenToVerify) return;

    let cancelled = false;

    void api
      .get("/auth/me")
      .then((response) => {
        const result = authMeResponseSchema.safeParse(response.data);
        if (!result.success) {
          throw new Error("Respons profil dari server tidak valid");
        }

        if (!cancelled) {
          setUser(result.data.user);
        }
      })
      .catch(() => {
        if (cancelled) return;

        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsInitializing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token || user?.role !== "BARISTA") return;

    const socket = io(API_ORIGIN, { auth: { token } });
    return () => {
      socket.disconnect();
    };
  }, [token, user?.role]);

  const login = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isInitializing, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

