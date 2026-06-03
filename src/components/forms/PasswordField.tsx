import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { FormError } from "./FormError";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
};

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(({ id, label, error, className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          className={cn(
            "block min-h-11 w-full rounded-md border border-ink-300 bg-white px-3 py-2 pr-11 text-sm text-ink-950 shadow-sm placeholder:text-ink-400 focus:border-ink-950 focus:ring-2 focus:ring-ink-200",
            error && "border-2 border-ink-950 bg-ink-50 focus:border-ink-950 focus:ring-ink-200",
            className,
          )}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          className="absolute right-1 top-1 min-h-0 px-2 py-1.5"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>
      <FormError message={error} />
    </div>
  );
});

PasswordField.displayName = "PasswordField";
