import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { PasswordField } from "../../components/forms/PasswordField";
import { TextField } from "../../components/forms/TextField";
import { ApiError } from "../../lib/api";
import * as authApi from "./auth.api";
import { registerSchema, type RegisterInput } from "./auth.schemas";
import { useAuth } from "./useAuth";
import { normalizeAuthUser } from "./auth.utils";

export function RegisterForm() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      await authApi.register(values);
      try {
        const user = normalizeAuthUser(await authApi.getMe());
        if (user) {
          setUser(user);
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch {
        setUser(null);
      }
      navigate("/login?registered=1", { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to register right now.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
        <TextField label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
      </div>
      <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <TextField label="Phone number" type="tel" autoComplete="tel" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
      <PasswordField label="Password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
      <PasswordField label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Register
      </Button>
      <p className="text-center text-sm text-ink-600">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
