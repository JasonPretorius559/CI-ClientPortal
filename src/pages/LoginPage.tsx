import { useSearchParams } from "react-router-dom";
import { Alert } from "../components/ui/Alert";
import { LoginForm } from "../features/auth/LoginForm";

export function LoginPage() {
  const [searchParams] = useSearchParams();

  return (
    <div className="space-y-5">
      {searchParams.get("registered") === "1" ? <Alert tone="success">Registration successful. You can now sign in.</Alert> : null}
      {searchParams.get("passwordReset") === "1" ? <Alert tone="success">Your password has been reset. You can now sign in.</Alert> : null}
      <LoginForm />
    </div>
  );
}
