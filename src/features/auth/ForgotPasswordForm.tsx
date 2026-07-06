import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/forms/TextField";
import { ApiError } from "../../lib/api";
import * as authApi from "./auth.api";
import { forgotPasswordSchema, type ForgotPasswordInput } from "./auth.schemas";

const successMessage = "If an account exists for this email, we have sent a reset link. Open the email and choose a new password.";

export function ForgotPasswordForm() {
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setNotice(null);
    setFormError(null);
    try {
      await authApi.forgotPassword(values.email);
      setNotice(successMessage);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setFormError("Too many requests. Please try again later.");
        return;
      }
      setNotice(successMessage);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <div className="rounded-[1.5rem] border border-surface-line bg-surface-muted px-4 py-4 text-sm leading-7 text-ink-700">
        Enter your email and we&apos;ll send you a secure link. Open it, type your new password, and sign back in.
      </div>
      <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        <Mail className="h-4 w-4" aria-hidden="true" />
        Email me a reset link
      </Button>
      <p className="text-center text-sm">
        <Link to="/login">Back to log in</Link>
      </p>
    </form>
  );
}
