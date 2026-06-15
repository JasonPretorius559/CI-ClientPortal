import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { TextField } from "../forms/TextField";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
};

export function SearchInput({
  label = "Search",
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className="search-input-shell">
      <Search
        className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-ink-400"
        aria-hidden="true"
      />
      <TextField
        type="search"
        label={label}
        className={["pl-9", className].filter(Boolean).join(" ")}
        {...props}
      />
    </div>
  );
}
