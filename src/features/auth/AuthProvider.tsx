import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../lib/api";
import type { LoginInput } from "./auth.schemas";
import * as authApi from "./auth.api";
import { AuthContext, type AuthContextValue } from "./auth.context";
import { normalizeAuthUser } from "./auth.utils";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    const currentUser = normalizeAuthUser(await authApi.getMe());
    setUser(currentUser);
    queryClient.setQueryData(["auth", "me"], currentUser);
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      try {
        const currentUser = normalizeAuthUser(await authApi.getMe());
        if (!isMounted) return;
        setUser(currentUser);
        queryClient.setQueryData(["auth", "me"], currentUser);
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof ApiError && error.status !== 401) {
          console.warn("Unable to hydrate auth session.");
        }
        setUser(null);
        queryClient.setQueryData(["auth", "me"], null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  const login = useCallback(
    async (values: LoginInput) => {
      await authApi.login(values);
      await refreshUser();
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session should be cleared even when the server is unreachable.
    } finally {
      setUser(null);
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
      setUser,
    }),
    [isLoading, login, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
