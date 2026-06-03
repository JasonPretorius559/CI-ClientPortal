import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { TextField } from "./TextField";

export const DateField = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; error?: string }>(
  (props, ref) => <TextField ref={ref} type="date" {...props} />,
);

DateField.displayName = "DateField";
