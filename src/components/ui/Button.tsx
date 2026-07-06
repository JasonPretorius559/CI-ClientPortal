import { cloneElement, forwardRef, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  asChild?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-ink-950 bg-ink-950 text-white hover:bg-ink-800 active:bg-black disabled:border-surface-line disabled:bg-ink-200 disabled:text-ink-500",
  secondary:
    "border-surface-line bg-white text-ink-900 hover:border-ink-300 hover:bg-surface-muted active:bg-ink-100 disabled:border-surface-line disabled:bg-surface-muted disabled:text-ink-500",
  ghost:
    "border-transparent bg-transparent text-ink-700 hover:bg-white hover:text-ink-900 active:bg-surface-muted disabled:text-ink-500",
  danger:
    "border-danger-100 bg-white text-danger-700 hover:border-danger-500 hover:bg-danger-50 active:bg-danger-100 disabled:border-surface-line disabled:bg-surface-muted disabled:text-ink-500",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading = false, disabled, children, type = "button", asChild = false, ...props }, ref) => {
    const buttonClassName = cn(
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      className,
    );

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string; "aria-disabled"?: boolean }>;
      return cloneElement(child, {
        className: cn(buttonClassName, child.props.className),
        "aria-disabled": disabled || isLoading || undefined,
      });
    }

    return (
      <button ref={ref} type={type} disabled={disabled || isLoading} className={buttonClassName} {...props}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
