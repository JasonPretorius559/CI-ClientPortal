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
  primary: "border-ink-950 bg-ink-950 text-white hover:bg-ink-800 disabled:border-ink-200 disabled:bg-ink-200 disabled:text-ink-500",
  secondary: "border-ink-300 bg-white text-ink-950 hover:bg-ink-100 disabled:bg-ink-100 disabled:text-ink-500",
  ghost: "border-transparent bg-transparent text-ink-900 hover:bg-ink-100 disabled:text-ink-500",
  danger: "border-ink-950 bg-ink-900 text-white hover:bg-ink-700 disabled:border-ink-200 disabled:bg-ink-200 disabled:text-ink-500",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading = false, disabled, children, type = "button", asChild = false, ...props }, ref) => {
    const buttonClassName = cn(
      "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold no-underline transition disabled:cursor-not-allowed disabled:opacity-60",
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
