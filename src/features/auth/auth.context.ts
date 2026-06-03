import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { LoginInput } from "./auth.schemas";

export type AuthContextValue = {
  user: unknown | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (values: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: Dispatch<SetStateAction<unknown | null>>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
