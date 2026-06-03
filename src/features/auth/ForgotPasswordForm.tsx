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

const successMessage = "If an account exists for this email, password reset instructions will be sent.";

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
      <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        <Mail className="h-4 w-4" aria-hidden="true" />
        Send reset instructions
      </Button>
      <p className="text-center text-sm">
        <Link to="/login">Back to log in</Link>
      </p>
    </form>
  );
}
