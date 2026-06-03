import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FullPageLoader } from "../components/ui/LoadingSkeleton";
import { useAuth } from "../features/auth/useAuth";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
