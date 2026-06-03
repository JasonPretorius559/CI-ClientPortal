import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
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
  const email = searchParams.get("email");
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
      setFormError("This password reset link is missing a valid token.");
      return;
    }
    try {
      await authApi.setPassword({ ...values, token, email });
      navigate("/login?passwordReset=1", { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to set your password right now.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {!token ? <Alert tone="error">This password reset link is missing a valid token.</Alert> : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <PasswordField label="New password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
      <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!token}>
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        Set password
      </Button>
      <p className="text-center text-sm">
        <Link to="/login">Back to log in</Link>
      </p>
    </form>
  );
}
