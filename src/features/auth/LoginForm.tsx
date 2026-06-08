import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { PasswordField } from "../../components/forms/PasswordField";
import { TextField } from "../../components/forms/TextField";
import { ApiError } from "../../lib/api";
import { useAuth } from "./useAuth";
import { loginSchema, type LoginInput } from "./auth.schemas";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError("Invalid email or password.");
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Unable to log in right now.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Sign in
      </Button>
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </form>
  );
}
