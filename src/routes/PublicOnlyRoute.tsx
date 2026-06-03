import { Navigate, Outlet } from "react-router-dom";
import { FullPageLoader } from "../components/ui/LoadingSkeleton";
import { useAuth } from "../features/auth/useAuth";

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
