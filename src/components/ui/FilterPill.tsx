import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function FilterPill({
  className,
  active = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn("filter-pill", active && "filter-pill-active", className)}
      {...props}
    />
  );
}
