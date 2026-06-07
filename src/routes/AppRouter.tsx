import { Navigate, Route, Routes } from "react-router-dom";
import { FullPageLoader } from "../components/ui/LoadingSkeleton";
import { AdminLayout } from "../features/admin/AdminLayout";
import { AdminMasterfileFormPage } from "../features/admin/pages/AdminMasterfileFormPage";
import { AdminMasterfileListPage } from "../features/admin/pages/AdminMasterfileListPage";
import { AdminSetupPage } from "../features/admin/pages/AdminSetupPage";
import { StructuredOutputSchemaEditorPage } from "../features/admin/structured-output-schemas/pages/StructuredOutputSchemaEditorPage";
import { StructuredOutputSchemasPage } from "../features/admin/structured-output-schemas/pages/StructuredOutputSchemasPage";
import { AdminRoute } from "../features/auth/AdminRoute";
import { useAuth } from "../features/auth/useAuth";
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
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/setup" replace />} />
              <Route path="setup" element={<AdminSetupPage />} />
              <Route path="setup/case-types" element={<AdminMasterfileListPage resourceKey="caseTypes" />} />
              <Route path="setup/case-types/new" element={<AdminMasterfileFormPage resourceKey="caseTypes" />} />
              <Route path="setup/case-types/:id" element={<AdminMasterfileFormPage resourceKey="caseTypes" />} />
              <Route path="setup/linked-case-types" element={<AdminMasterfileListPage resourceKey="linkedCaseTypes" />} />
              <Route path="setup/linked-case-types/new" element={<AdminMasterfileFormPage resourceKey="linkedCaseTypes" />} />
              <Route path="setup/linked-case-types/:id" element={<AdminMasterfileFormPage resourceKey="linkedCaseTypes" />} />
              <Route path="setup/entity-types" element={<AdminMasterfileListPage resourceKey="entityTypes" />} />
              <Route path="setup/entity-types/new" element={<AdminMasterfileFormPage resourceKey="entityTypes" />} />
              <Route path="setup/entity-types/:id" element={<AdminMasterfileFormPage resourceKey="entityTypes" />} />
              <Route path="setup/structured-output-schemas" element={<StructuredOutputSchemasPage />} />
              <Route path="setup/structured-output-schemas/new" element={<StructuredOutputSchemaEditorPage />} />
              <Route path="setup/structured-output-schemas/:id" element={<StructuredOutputSchemaEditorPage />} />
              <Route path="report-designs" element={<ReportDesignsPage />} />
              <Route path="report-designs/new" element={<ReportDesignEditorPage />} />
              <Route path="report-designs/:id" element={<ReportDesignEditorPage />} />
            </Route>
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
