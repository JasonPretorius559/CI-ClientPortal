import { Navigate, Route, Routes } from "react-router-dom";
import { FullPageLoader } from "../components/ui/LoadingSkeleton";
import { AdminLayout } from "../features/admin/AdminLayout";
import { AdminMasterfileFormPage } from "../features/admin/pages/AdminMasterfileFormPage";
import { AdminMasterfileListPage } from "../features/admin/pages/AdminMasterfileListPage";
import { AdminSetupPage } from "../features/admin/pages/AdminSetupPage";
import { AdminUserRegistrationPage } from "../features/admin/pages/AdminUserRegistrationPage";
import { AdminUsersPage } from "../features/admin/pages/AdminUsersPage";
import { CaseTypePromptEditorPage } from "../features/admin/case-type-prompts/pages/CaseTypePromptEditorPage";
import { CaseTypePromptsPage } from "../features/admin/case-type-prompts/pages/CaseTypePromptsPage";
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
import { SetPasswordPage } from "../pages/SetPasswordPage";
import { SettingsPage } from "../pages/SettingsPage";
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
              <Route path="setup/case-type-prompts" element={<CaseTypePromptsPage />} />
              <Route path="setup/case-type-prompts/new" element={<CaseTypePromptEditorPage />} />
              <Route path="setup/case-type-prompts/:id" element={<CaseTypePromptEditorPage />} />
              <Route path="setup/entity-types" element={<AdminMasterfileListPage resourceKey="entityTypes" />} />
              <Route path="setup/entity-types/new" element={<AdminMasterfileFormPage resourceKey="entityTypes" />} />
              <Route path="setup/entity-types/:id" element={<AdminMasterfileFormPage resourceKey="entityTypes" />} />
              <Route path="setup/users" element={<AdminUsersPage />} />
              <Route path="setup/users/new" element={<AdminUserRegistrationPage />} />
              <Route path="setup/structured-output-schemas" element={<StructuredOutputSchemasPage />} />
              <Route path="setup/structured-output-schemas/new" element={<StructuredOutputSchemaEditorPage />} />
              <Route path="setup/structured-output-schemas/:id" element={<StructuredOutputSchemaEditorPage />} />
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
