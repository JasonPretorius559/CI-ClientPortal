import { cn } from "../../lib/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-ink-200/80", className)} />;
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-ink-200 border-t-ink-950" />
        <p className="mt-4 text-sm font-medium text-ink-600">Loading your portal...</p>
      </div>
    </div>
  );
}
