export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm font-medium text-ink-950">Warning: {message}</p>;
}
