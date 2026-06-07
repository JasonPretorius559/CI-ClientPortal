import type { ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { FullPageLoader } from "../../components/ui/LoadingSkeleton";
import { Button } from "../../components/ui/Button";
import { useAuth } from "./useAuth";
import { isAdminUser } from "./auth.utils";

export function AccessDeniedPage() {
  return (
    <div className="rounded-lg border-2 border-ink-950 bg-white px-6 py-10 text-center shadow-soft">
      <h1 className="text-xl font-semibold text-ink-950">Access denied</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-ink-600">
        You need an administrator account to access this area.
      </p>
      <Button asChild className="mt-6" variant="secondary">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

export function AdminRoute({ children }: { children?: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdminUser(user)) return <AccessDeniedPage />;

  return children ? <>{children}</> : <Outlet />;
}
