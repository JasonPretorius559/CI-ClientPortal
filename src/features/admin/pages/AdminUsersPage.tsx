import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MailPlus, PencilLine, Search, Trash2, UserPlus, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../components/ui/toast-context";
import { SelectField } from "../../../components/forms/SelectField";
import { TextField } from "../../../components/forms/TextField";
import { formatDate } from "../../../lib/dates";
import { readString } from "../adminPayload.utils";
import { AdminPageAccess } from "../AdminPageAccess";
import { useAuth } from "../../auth/useAuth";
import {
  createAdminUser,
  deactivateAdminUser,
  listAdminUsers,
  updateAdminUser,
  type AdminUser,
  type AdminUserCreatePayload,
  type AdminUserRole,
  type AdminUserStatus,
} from "../adminUsers.api";

type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: AdminUserRole;
  status: AdminUserStatus;
};

type UserFormErrors = Partial<Record<keyof UserFormState, string>>;

const emptyForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  role: "user",
  status: "active",
};

const roleOptions = [
  { label: "All roles", value: "" },
  { label: "Users", value: "user" },
  { label: "Administrators", value: "admin" },
];

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const formRoleOptions = roleOptions.slice(1);
const formStatusOptions = statusOptions.slice(1);

function validatePassword(password: string, required: boolean) {
  if (!password && !required) return "";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  return "";
}

function validateForm(form: UserFormState, isEditing: boolean) {
  const errors: UserFormErrors = {};

  if (!form.name.trim()) errors.name = "Full name is required.";

  if (!form.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const passwordError = validatePassword(form.password, !isEditing);
  if (passwordError) errors.password = passwordError;

  return errors;
}

function getUserId(value: unknown) {
  return readString(value, ["id", "_id"]);
}

function userToForm(user: AdminUser): UserFormState {
  return {
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
    status: user.status,
  };
}

function toCreatePayload(form: UserFormState): AdminUserCreatePayload {
  return {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    role: form.role,
    status: form.status,
  };
}

function statusTone(status: AdminUserStatus) {
  if (status === "active") return "outline";
  if (status === "suspended") return "attention";
  return "dashed";
}

function UserFormDialog({
  editingUser,
  errors,
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  editingUser: AdminUser | null;
  errors: UserFormErrors;
  form: UserFormState;
  isSubmitting: boolean;
  onChange: (nextForm: UserFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(editingUser);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/35 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{isEditing ? "Edit User" : "Create User"}</CardTitle>
            <p className="mt-1 text-sm text-ink-600">{isEditing ? editingUser?.email : "Add a portal account with a temporary password."}</p>
          </div>
          <Button variant="ghost" className="px-3" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Full name"
                value={form.name}
                error={errors.name}
                autoComplete="name"
                onChange={(event) => onChange({ ...form, name: event.target.value })}
              />
              <TextField
                label="Email address"
                type="email"
                value={form.email}
                error={errors.email}
                autoComplete="email"
                onChange={(event) => onChange({ ...form, email: event.target.value })}
              />
            </div>

            <TextField
              label={isEditing ? "New password" : "Temporary password"}
              type="password"
              value={form.password}
              error={errors.password}
              autoComplete="new-password"
              placeholder={isEditing ? "Leave blank to keep current password" : undefined}
              onChange={(event) => onChange({ ...form, password: event.target.value })}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="System role"
                value={form.role}
                error={errors.role}
                options={formRoleOptions}
                onChange={(event) => onChange({ ...form, role: event.target.value as AdminUserRole })}
              />
              <SelectField
                label="Account status"
                value={form.status}
                error={errors.status}
                options={formStatusOptions}
                onChange={(event) => onChange({ ...form, status: event.target.value as AdminUserStatus })}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-ink-200 pt-5 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {isEditing ? <PencilLine className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
                {isEditing ? "Save Changes" : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<{ q: string; role: AdminUserRole | ""; status: AdminUserStatus | ""; page: number }>({
    q: "",
    role: "",
    status: "",
    page: 1,
  });
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const currentUserId = getUserId(currentUser);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => listAdminUsers({ ...filters, limit: 20 }),
  });

  const users = usersQuery.data?.users ?? [];
  const pagination = usersQuery.data?.pagination;

  const summary = useMemo(() => {
    if (!pagination) return "Loading users";
    if (pagination.total === 1) return "1 user";
    return `${pagination.total} users`;
  }, [pagination]);

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast({ tone: "success", title: "User created." });
    },
    onError: (error) => {
      showToast({ tone: "error", title: error instanceof Error ? error.message : "Unable to create this user." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminUserCreatePayload> }) => updateAdminUser(id, payload),
    onSuccess: () => {
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast({ tone: "success", title: "User updated." });
    },
    onError: (error) => {
      showToast({ tone: "error", title: error instanceof Error ? error.message : "Unable to update this user." });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast({ tone: "success", title: "User deactivated." });
    },
    onError: (error) => {
      showToast({ tone: "error", title: error instanceof Error ? error.message : "Unable to deactivate this user." });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormErrors({});
    setIsFormOpen(true);
  }

  function openEditForm(userRecord: AdminUser) {
    setEditingUser(userRecord);
    setForm(userToForm(userRecord));
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchInput.trim(), page: 1 }));
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form, Boolean(editingUser));
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (editingUser) {
      const payload: Partial<AdminUserCreatePayload> = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        status: form.status,
      };

      if (form.password) payload.password = form.password;

      updateMutation.mutate({ id: editingUser.id, payload });
      return;
    }

    createMutation.mutate(toCreatePayload(form));
  }

  function goToPage(page: number) {
    setFilters((current) => ({ ...current, page }));
  }

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage portal accounts, roles, statuses, and access lifecycle."
          action={(
            <>
              <Button asChild variant="secondary">
                <Link to="/admin/setup/users/new">
                  <MailPlus className="h-4 w-4" aria-hidden="true" />
                  Invite
                </Link>
              </Button>
              <Button onClick={openCreateForm}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                New
              </Button>
            </>
          )}
        />

        <Card>
          <CardContent>
            <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]" onSubmit={handleFilterSubmit}>
              <TextField
                label="Search"
                value={searchInput}
                placeholder="Name or email"
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <SelectField
                label="Role"
                value={filters.role}
                options={roleOptions}
                onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value as AdminUserRole | "", page: 1 }))}
              />
              <SelectField
                label="Status"
                value={filters.status}
                options={statusOptions}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as AdminUserStatus | "", page: 1 }))}
              />
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {usersQuery.isLoading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-12" />
            <LoadingSkeleton className="h-80" />
          </div>
        ) : null}

        {usersQuery.isError ? (
          <ErrorState
            title="Unable to load users"
            message={usersQuery.error instanceof Error ? usersQuery.error.message : "The user list could not be loaded."}
            onRetry={() => void usersQuery.refetch()}
          />
        ) : null}

        {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Create or invite a user to make them available in the portal."
            action={<Button onClick={openCreateForm}>Create User</Button>}
          />
        ) : null}

        {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
            {deactivateMutation.isError ? (
              <Alert tone="error" className="m-4">
                {deactivateMutation.error instanceof Error ? deactivateMutation.error.message : "Unable to deactivate this user."}
              </Alert>
            ) : null}
            <div className="flex flex-col gap-2 border-b border-ink-200 px-4 py-3 text-sm text-ink-600 sm:flex-row sm:items-center sm:justify-between">
              <span>{summary}</span>
              {pagination ? (
                <span>
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 text-sm">
                <thead className="bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Usage</th>
                    <th className="px-4 py-3">Last login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {users.map((userRecord) => {
                    const isCurrentUser = currentUserId === userRecord.id;
                    return (
                      <tr key={userRecord.id}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-ink-950">{userRecord.name}</div>
                          <div className="mt-1 text-xs text-ink-500">{userRecord.email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge tone={userRecord.role === "admin" ? "solid" : "muted"}>
                            {userRecord.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge tone={statusTone(userRecord.status)}>{userRecord.status}</Badge>
                        </td>
                        <td className="px-4 py-4 text-ink-600">
                          {userRecord.analysisUsed ?? 0} / {userRecord.analysisLimit ?? 0}
                        </td>
                        <td className="px-4 py-4 text-ink-600">{formatDate(userRecord.lastLoginAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" className="px-3" aria-label={`Edit ${userRecord.name}`} onClick={() => openEditForm(userRecord)}>
                              <PencilLine className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="danger"
                              className="px-3"
                              aria-label={`Deactivate ${userRecord.name}`}
                              disabled={isCurrentUser || deactivateMutation.isPending}
                              isLoading={deactivateMutation.isPending && deactivateMutation.variables === userRecord.id}
                              onClick={() => {
                                if (window.confirm(`Deactivate ${userRecord.name}?`)) deactivateMutation.mutate(userRecord.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination && pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-ink-200 px-4 py-3">
                <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-ink-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button variant="secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {isFormOpen ? (
          <UserFormDialog
            editingUser={editingUser}
            errors={formErrors}
            form={form}
            isSubmitting={isSubmitting}
            onChange={(nextForm) => {
              setForm(nextForm);
              setFormErrors({});
            }}
            onClose={closeForm}
            onSubmit={handleFormSubmit}
          />
        ) : null}
      </div>
    </AdminPageAccess>
  );
}
