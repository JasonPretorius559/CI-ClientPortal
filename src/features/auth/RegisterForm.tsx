import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { UserPlus } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { PasswordField } from "../../components/forms/PasswordField";
import { TextField } from "../../components/forms/TextField";
import { ApiError } from "../../lib/api";
import * as authApi from "./auth.api";
import { registerSchema, type RegisterInput } from "./auth.schemas";

export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
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
    setSuccessMessage(null);
    try {
      await authApi.register(values);
      reset();
      setSuccessMessage("User registered successfully.");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to register right now.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
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
        Create User
      </Button>
    </form>
  );
}
