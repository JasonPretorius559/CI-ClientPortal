import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { FullPageLoader } from "../components/ui/LoadingSkeleton";
import { useAuth } from "../features/auth/useAuth";
import { isAdminUser } from "../features/auth/auth.utils";
import { AuthLayout } from "../layouts/AuthLayout";
import { PortalLayout } from "../layouts/PortalLayout";
import { CaseDetailPage } from "../pages/CaseDetailPage";
import { CasesPage } from "../pages/CasesPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { LoginPage } from "../pages/LoginPage";
import { NewCasePage } from "../pages/NewCasePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { SetPasswordPage } from "../pages/SetPasswordPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ReportDesignEditorPage } from "../pages/admin/ReportDesignEditorPage";
import { ReportDesignsPage } from "../pages/admin/ReportDesignsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function AdminOnlyRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (!isAdminUser(user)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout title="Welcome back" description="Sign in to manage your Cloud Insure cases." />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<AuthLayout title="Create your account" description="Register for access to your Cloud Insure user portal." />}>
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<AuthLayout title="Reset your password" description="Request secure password reset instructions." />}>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route element={<AuthLayout title="Set your password" description="Choose a new password for your account." />}>
          <Route path="/set-password" element={<SetPasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/new" element={<NewCasePage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/cases/:id/report-designer" element={<Navigate to="/admin/report-designs" replace />} />
          <Route path="/reports/templates" element={<Navigate to="/admin/report-designs" replace />} />
          <Route path="/reports/designer" element={<Navigate to="/admin/report-designs" replace />} />
          <Route path="/reports/designer/:templateId" element={<Navigate to="/admin/report-designs" replace />} />
          <Route element={<AdminOnlyRoute />}>
            <Route path="/admin/report-designs" element={<ReportDesignsPage />} />
            <Route path="/admin/report-designs/new" element={<ReportDesignEditorPage />} />
            <Route path="/admin/report-designs/:id" element={<ReportDesignEditorPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
