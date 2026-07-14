import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MailPlus, PencilLine, ShieldCheck, Trash2, UserPlus, UsersRound, UserX, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { CommandBar, CommandBarGroup } from "../../../components/ui/CommandBar";
import {
  DataGrid,
  DataGridCell,
  DataGridHeaderCell,
  DataGridMeta,
  DataGridTable,
} from "../../../components/ui/DataGrid";
import { DashboardMetricCard } from "../../../components/ui/DashboardMetricCard";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { FilterPill } from "../../../components/ui/FilterPill";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { PageTabs } from "../../../components/ui/PageTabs";
import { PageShell } from "../../../components/ui/PageShell";
import { SearchInput } from "../../../components/ui/SearchInput";
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



const formRoleOptions = roleOptions.slice(1);
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
    <>
      <div className="dialog-overlay" aria-hidden="true" onClick={onClose} />
      <div className="dialog-frame" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <Card className="dialog-shell">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle id="user-form-title">{isEditing ? "Edit user" : "Create user"}</CardTitle>
              <p className="mt-2 text-sm text-ink-600">{isEditing ? editingUser?.email : "Add a portal account with a temporary password."}</p>
            </div>
            <Button variant="ghost" className="px-2" aria-label="Close user form" onClick={onClose}>
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
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

              <div>
                <SelectField
                  label="System role"
                  value={form.role}
                  error={errors.role}
                  options={formRoleOptions}
                  onChange={(event) => onChange({ ...form, role: event.target.value as AdminUserRole })}
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
    </>
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

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);
  const pagination = usersQuery.data?.pagination;

  const summary = useMemo(() => {
    if (!pagination) return "Loading users";
    if (pagination.total === 1) return "1 user";
    return `${pagination.total} users`;
  }, [pagination]);

  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.status === "active").length;
    const admins = users.filter((item) => item.role === "admin").length;
    const inactive = users.filter((item) => item.status !== "active").length;

    return { total, active, admins, inactive };
  }, [users]);

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
      <PageShell>
        <PageHeader
          title="Users"
          description="Manage portal accounts, roles, statuses, and access lifecycle."
          tabs={(
            <PageTabs
              items={[
                { key: "overview", label: "Overview", active: true },
                { key: "directory", label: "Directory", suffix: <span className="text-ink-400">{pagination?.total ?? users.length}</span> },
                { key: "settings", label: "Access" },
              ]}
            />
          )}
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

        {!usersQuery.isLoading && !usersQuery.isError ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              label="Total users"
              value={metrics.total}
              icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
            />
            <DashboardMetricCard
              label="Active"
              value={metrics.active}
              icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
            />
            <DashboardMetricCard
              label="Administrators"
              value={metrics.admins}
              icon={<MailPlus className="h-5 w-5" aria-hidden="true" />}
            />
            <DashboardMetricCard
              label="Inactive or suspended"
              value={metrics.inactive}
              icon={<UserX className="h-5 w-5" aria-hidden="true" />}
            />
          </div>
        ) : null}

        <CommandBar sticky aria-label="User filters">
          <div className="toolbar">
            <div>
              <p className="page-toolbar-meta">Directory tools</p>
              <p className="mt-1 text-sm text-ink-600">Search, filter, and focus the user directory.</p>
            </div>
            <form className="w-full lg:flex-1" onSubmit={handleFilterSubmit}>
              <CommandBarGroup className="lg:justify-end">
                <div className="toolbar-group">
                  <FilterPill
                    active={filters.status === ""}
                    onClick={() => setFilters((current) => ({ ...current, status: "", page: 1 }))}
                  >
                    All users
                  </FilterPill>
                  <FilterPill
                    active={filters.status === "active"}
                    onClick={() => setFilters((current) => ({ ...current, status: "active", page: 1 }))}
                  >
                    Active
                  </FilterPill>
                  <FilterPill
                    active={filters.role === "admin"}
                    onClick={() => setFilters((current) => ({ ...current, role: "admin", page: 1 }))}
                  >
                    Admins
                  </FilterPill>
                </div>
                <div className="min-w-0 flex-1 lg:max-w-sm">
                  <SearchInput
                    label="Search"
                    placeholder="Search users"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <SelectField
                    label="Role"
                    value={filters.role}
                    options={roleOptions}
                    onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value as AdminUserRole | "", page: 1 }))}
                  />
                </div>
                
              </CommandBarGroup>
            </form>
          </div>
        </CommandBar>

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
          <DataGrid className="space-y-4">
            {deactivateMutation.isError ? (
              <Alert tone="error" className="mb-1">
                {deactivateMutation.error instanceof Error ? deactivateMutation.error.message : "Unable to deactivate this user."}
              </Alert>
            ) : null}
            <DataGridMeta>
              <span className="font-medium text-ink-700">{summary}</span>
              {pagination ? (
                <span className="text-ink-500">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
              ) : null}
            </DataGridMeta>
            <div className="data-table-shell">
              <DataGridTable>
                <thead>
                  <tr>
                    <DataGridHeaderCell>User</DataGridHeaderCell>
                    <DataGridHeaderCell>Role</DataGridHeaderCell>
                    <DataGridHeaderCell>Status</DataGridHeaderCell>
                    <DataGridHeaderCell>Last login</DataGridHeaderCell>
                    <DataGridHeaderCell className="text-right">Actions</DataGridHeaderCell>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-line">
                  {users.map((userRecord) => {
                    const isCurrentUser = currentUserId === userRecord.id;
                    return (
                      <tr key={userRecord.id}>
                        <DataGridCell>
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                              {userRecord.name
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part.charAt(0).toUpperCase())
                                .join("") || "CI"}
                            </div>
                            <div>
                              <div className="font-medium text-ink-950">{userRecord.name}</div>
                              <div className="mt-1 text-xs text-ink-500">{userRecord.email}</div>
                            </div>
                          </div>
                        </DataGridCell>
                        <DataGridCell>
                          <Badge tone={userRecord.role === "admin" ? "solid" : "muted"}>
                            {userRecord.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </DataGridCell>
                        <DataGridCell>
                          <Badge tone={statusTone(userRecord.status)}>{userRecord.status}</Badge>
                        </DataGridCell>
                        <DataGridCell className="text-ink-600">{formatDate(userRecord.lastLoginAt)}</DataGridCell>
                        <DataGridCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" className="px-3" aria-label={`Edit ${userRecord.name}`} onClick={() => openEditForm(userRecord)}>
                              <PencilLine className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="px-3 text-danger-700 hover:bg-danger-50 hover:text-danger-700"
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
                        </DataGridCell>
                      </tr>
                    );
                  })}
                </tbody>
              </DataGridTable>
            </div>
            {pagination && pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between px-1 py-1">
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
          </DataGrid>
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

      </PageShell>
    </AdminPageAccess>
  );
}
