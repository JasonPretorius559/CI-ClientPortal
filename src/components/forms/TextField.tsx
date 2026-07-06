import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { FormError } from "./FormError";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({ id, label, error, className, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "mt-1.5 block min-h-11 w-full rounded-lg border border-surface-line bg-white px-3.5 py-2.5 text-sm text-ink-950 transition-colors placeholder:text-ink-400 focus:border-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-100",
          error && "border-danger-100 bg-danger-50 focus:border-danger-500 focus:ring-danger-100",
          className,
        )}
        {...props}
      />
      <FormError message={error} />
    </div>
  );
});

TextField.displayName = "TextField";
