import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-ink-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-ink-950">Page not found</h1>
        <p className="mt-2 text-sm text-ink-600">The page you are looking for does not exist.</p>
        <Button asChild className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
