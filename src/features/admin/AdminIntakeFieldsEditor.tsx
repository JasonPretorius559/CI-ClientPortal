import { Plus, Trash2 } from "lucide-react";
import { TextField } from "../../components/forms/TextField";
import { TextareaField } from "../../components/forms/TextareaField";
import { Button } from "../../components/ui/Button";
import type { IntakeFieldDefinition, IntakeFieldType } from "./adminMasterfile.api";

const fieldTypes: Array<{ value: IntakeFieldType; label: string }> = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Select list" },
  { value: "boolean", label: "Yes / no" },
];

const emptyField = (): IntakeFieldDefinition => ({
  key: "",
  label: "",
  type: "text",
  required: false,
  options: [],
  helpText: "",
  includeInAnalysis: true,
  includeInReport: true,
});

type Props = {
  fields: IntakeFieldDefinition[];
  error?: string;
  onChange: (fields: IntakeFieldDefinition[]) => void;
};

export function AdminIntakeFieldsEditor({ fields, error, onChange }: Props) {
  const updateField = (index: number, patch: Partial<IntakeFieldDefinition>) => {
    onChange(fields.map((field, currentIndex) => currentIndex === index ? { ...field, ...patch } : field));
  };

  return (
    <section className="rounded-[1.5rem] border border-ink-200 bg-ink-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-ink-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-950">Intake questions</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">Capture the information users must provide for this case type. These definitions are snapshotted when a case is created.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => onChange([...fields, emptyField()])}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add question
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-danger-700">{error}</p> : null}

      {fields.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-600">No additional intake questions. Add one when this case type needs structured user input.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {fields.map((field, index) => (
            <article key={`${field.key}-${index}`} className="relative rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-500">Question {String(index + 1).padStart(2, "0")}</p>
                <Button type="button" variant="ghost" className="min-h-9 px-2 py-1.5" aria-label={`Remove question ${index + 1}`} onClick={() => onChange(fields.filter((_, currentIndex) => currentIndex !== index))}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Question label" value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} />
                <div className="space-y-1">
                  <TextField label="Data key" value={field.key} onChange={(event) => updateField(index, { key: event.target.value })} />
                  <p className="text-xs text-ink-600">Lowercase letters, numbers, and underscores.</p>
                </div>
                <label className="space-y-2 text-sm font-medium text-ink-950">
                  <span>Response type</span>
                  <select value={field.type} onChange={(event) => updateField(index, { type: event.target.value as IntakeFieldType, options: event.target.value === "select" ? field.options : [] })} className="h-12 w-full rounded-xl border border-ink-300 bg-white px-4 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus:ring-2 focus:ring-ink-200">
                    {fieldTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                {field.type === "select" ? <div className="space-y-1"><TextField label="Options" value={field.options.join(", ")} onChange={(event) => updateField(index, { options: event.target.value.split(",").map((option) => option.trim()).filter(Boolean) })} /><p className="text-xs text-ink-600">Comma-separated choices.</p></div> : null}
                <div className={field.type === "select" ? "md:col-span-2" : ""}>
                  <TextareaField label="Help text" value={field.helpText} onChange={(event) => updateField(index, { helpText: event.target.value })} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 border-t border-ink-100 pt-4 text-sm font-medium text-ink-800">
                <label className="flex items-center gap-2"><input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} className="h-4 w-4 rounded border-ink-300 text-ink-950 focus:ring-ink-200" />Required</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={field.includeInAnalysis} onChange={(event) => updateField(index, { includeInAnalysis: event.target.checked })} className="h-4 w-4 rounded border-ink-300 text-ink-950 focus:ring-ink-200" />Include in analysis</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={field.includeInReport} onChange={(event) => updateField(index, { includeInReport: event.target.checked })} className="h-4 w-4 rounded border-ink-300 text-ink-950 focus:ring-ink-200" />Include in report</label>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
