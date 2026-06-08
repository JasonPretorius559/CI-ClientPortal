import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailPlus } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SelectField } from "../../../components/forms/SelectField";
import { TextField } from "../../../components/forms/TextField";
import { ApiError, apiFetch } from "../../../lib/api";
import { AdminPageAccess } from "../AdminPageAccess";

type InviteRole = "user" | "admin";

type InvitePayload = {
  name: string;
  email: string;
  role: InviteRole;
};

const emptyForm: InvitePayload = {
  name: "",
  email: "",
  role: "user",
};

function inviteUser(payload: InvitePayload) {
  return apiFetch<unknown>("/api/admin/users/invite", {
    method: "POST",
    body: payload,
  });
}

export function AdminUserRegistrationPage() {
  const [form, setForm] = useState<InvitePayload>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof InvitePayload, string>>>({});
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    const nextErrors: Partial<Record<keyof InvitePayload, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Full name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.role) {
      nextErrors.role = "Role is required.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await inviteUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
      });

      setStatus({
        type: "success",
        message: "User invited successfully. They will receive an email to set their password.",
      });

      setForm(emptyForm);
      setFieldErrors({});
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof ApiError ? error.message : "Unable to send invitation right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="Invite User"
          description="Create a portal account and email the user a password setup link."
          action={
            <Button asChild variant="secondary">
              <Link to="/admin/setup">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to setup
              </Link>
            </Button>
          }
        />

        <Card className="max-w-2xl">
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {status ? (
                <Alert tone={status.type === "success" ? "success" : "error"}>{status.message}</Alert>
              ) : null}

              <TextField
                label="Full name"
                autoComplete="name"
                value={form.name}
                error={fieldErrors.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  if (event.target.value.trim()) {
                    setFieldErrors((current) => ({ ...current, name: undefined }));
                  }
                }}
              />

              <TextField
                label="Email address"
                type="email"
                autoComplete="email"
                value={form.email}
                error={fieldErrors.email}
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }));
                  if (event.target.value.trim()) {
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }
                }}
              />

              <SelectField
                label="System role"
                value={form.role}
                error={fieldErrors.role}
                onChange={(event) => {
                  setForm((current) => ({ ...current, role: event.target.value as InviteRole }));
                  setFieldErrors((current) => ({ ...current, role: undefined }));
                }}
                options={[
                  { label: "User", value: "user" },
                  { label: "Administrator", value: "admin" },
                ]}
              />

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <MailPlus className="h-4 w-4" aria-hidden="true" />
                Send Invitation Email
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminPageAccess>
  );
}