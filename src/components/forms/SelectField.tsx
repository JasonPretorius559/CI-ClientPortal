import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { FormError } from "./FormError";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: Array<{ label: string; value: string }>;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(({ id, label, error, className, options, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <select
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "mt-1.5 block min-h-11 w-full rounded-xl border border-surface-line bg-white px-3.5 py-2.5 text-sm text-ink-950 shadow-sm transition-colors focus:border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-100",
          error && "border-danger-100 bg-danger-50 focus:border-danger-500 focus:ring-danger-100",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FormError message={error} />
    </div>
  );
});

SelectField.displayName = "SelectField";
