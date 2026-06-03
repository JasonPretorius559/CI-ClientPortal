import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-lg border-2 border-ink-950 bg-white px-6 py-8 text-center text-ink-950 shadow-soft">
      <AlertTriangle className="mx-auto h-8 w-8" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
