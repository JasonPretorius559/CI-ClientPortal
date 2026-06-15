import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function CommandBar({
  className,
  sticky = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { sticky?: boolean }) {
  return (
    <div
      className={cn("command-bar", sticky && "command-bar-sticky", className)}
      {...props}
    />
  );
}

export function CommandBarGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("command-bar-group", className)} {...props} />;
}
