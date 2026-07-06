import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { PasswordField } from "../../components/forms/PasswordField";
import { ApiError } from "../../lib/api";
import * as authApi from "./auth.api";
import { setPasswordSchema, type SetPasswordFormInput } from "./auth.schemas";

export function SetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SetPasswordFormInput) {
    setFormError(null);
    if (!token) {
      setFormError("This reset link is invalid or incomplete. Request a new reset email and try again.");
      return;
    }
    try {
      await authApi.setPassword({ ...values, token });
      navigate("/login?passwordReset=1", { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to set your password right now.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-[1.5rem] border border-surface-line bg-surface-muted px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-surface-line bg-white text-ink-900">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="text-sm leading-7 text-ink-700">
            Opened from your email? Enter a new password below and we&apos;ll update your account right away.
          </div>
        </div>
      </div>
      {!token ? <Alert tone="error">This reset link is invalid or incomplete. Request a new reset email and try again.</Alert> : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <PasswordField label="New password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
      <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!token}>
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        Save new password
      </Button>
      <p className="text-center text-sm">
        <Link to="/login">Back to log in</Link>
      </p>
    </form>
  );
}
