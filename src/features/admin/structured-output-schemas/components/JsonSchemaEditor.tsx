import { Braces, CheckCircle2, Wand2 } from "lucide-react";
import { FormError } from "../../../../components/forms/FormError";
import { Button } from "../../../../components/ui/Button";
import { cn } from "../../../../lib/cn";
import { starterJsonSchema } from "../structuredOutputSchemas.utils";

type JsonSchemaEditorProps = {
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onError: (error: string) => void;
};

function parseJson(value: string) {
  return JSON.parse(value) as Record<string, unknown>;
}

export function JsonSchemaEditor({ value, error, disabled, onChange, onError }: JsonSchemaEditorProps) {
  const formatJson = () => {
    try {
      onChange(JSON.stringify(parseJson(value), null, 2));
      onError("");
    } catch (parseError) {
      onError(parseError instanceof Error ? parseError.message : "JSON is not valid.");
    }
  };

  const validateJson = () => {
    try {
      parseJson(value);
      onError("");
    } catch (parseError) {
      onError(parseError instanceof Error ? parseError.message : "JSON is not valid.");
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="jsonSchema" className="block text-sm font-medium text-ink-800">
          JSON Schema
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="px-3" disabled={disabled} onClick={formatJson}>
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            Format JSON
          </Button>
          <Button type="button" variant="secondary" className="px-3" disabled={disabled} onClick={validateJson}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Validate JSON
          </Button>
          <Button type="button" variant="secondary" className="px-3" disabled={disabled} onClick={() => onChange(JSON.stringify(starterJsonSchema, null, 2))}>
            <Braces className="h-4 w-4" aria-hidden="true" />
            Starter
          </Button>
        </div>
      </div>
      <textarea
        id="jsonSchema"
        value={value}
        disabled={disabled}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "mt-2 block min-h-[24rem] w-full rounded-md border border-ink-300 bg-white px-3 py-3 font-mono text-sm leading-6 text-ink-950 shadow-sm placeholder:text-ink-400 focus:border-ink-950 focus:ring-2 focus:ring-ink-200",
          error && "border-2 border-ink-950 bg-ink-50",
          disabled && "cursor-not-allowed bg-ink-100 text-ink-600",
        )}
      />
      <FormError message={error} />
    </div>
  );
}
