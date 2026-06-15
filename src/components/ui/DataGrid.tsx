import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";

export function DataGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("data-grid", className)} {...props} />;
}

export function DataGridMeta({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("data-grid-meta", className)} {...props} />;
}

export function DataGridTable({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("data-grid-table", className)} {...props} />;
}

export function DataGridCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("data-grid-cell", className)} {...props} />;
}

export function DataGridHeaderCell({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("data-grid-head-cell", className)} {...props} />;
}
