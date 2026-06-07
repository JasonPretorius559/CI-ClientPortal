import { EmptyState } from "../../../../components/ui/EmptyState";
import type { StructuredOutputSchemaField } from "../structuredOutputSchemas.types";

type SchemaFieldsPreviewProps = {
  fields: StructuredOutputSchemaField[];
};

export function SchemaFieldsPreview({ fields }: SchemaFieldsPreviewProps) {
  if (fields.length === 0) {
    return (
      <EmptyState
        title="No fields generated yet"
        description="Save this schema to generate field metadata."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-200 text-sm">
          <thead className="bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Array</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {fields.map((field) => (
              <tr key={field.path}>
                <td className="px-4 py-3 font-mono text-xs text-ink-950">{field.path}</td>
                <td className="px-4 py-3 text-ink-800">{field.label}</td>
                <td className="px-4 py-3 text-ink-700">{field.type}</td>
                <td className="px-4 py-3 text-ink-700">{field.array ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-ink-700">{field.required ? "Yes" : "No"}</td>
                <td className="max-w-md px-4 py-3 text-ink-600">{field.description || "No description provided."}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
