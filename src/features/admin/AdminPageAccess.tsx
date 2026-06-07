import type { ReactNode } from "react";
import { AccessDeniedPage } from "../auth/AdminRoute";
import { isAdminUser } from "../auth/auth.utils";
import { useAuth } from "../auth/useAuth";

export function AdminPageAccess({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!isAdminUser(user)) return <AccessDeniedPage />;
  return <>{children}</>;
}
