import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="surface-card px-6 py-8 text-center text-ink-950 sm:px-8">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-ink-300 bg-ink-50">
        <AlertTriangle className="h-5 w-5 text-ink-700" aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
