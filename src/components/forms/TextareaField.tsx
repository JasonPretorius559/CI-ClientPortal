import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { FormError } from "./FormError";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({ id, label, error, className, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "mt-1.5 block min-h-32 w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-950 shadow-sm placeholder:text-ink-400 focus:border-ink-950 focus:ring-2 focus:ring-ink-200",
          error && "border-2 border-ink-950 bg-ink-50 focus:border-ink-950 focus:ring-ink-200",
          className,
        )}
        {...props}
      />
      <FormError message={error} />
    </div>
  );
});

TextareaField.displayName = "TextareaField";
