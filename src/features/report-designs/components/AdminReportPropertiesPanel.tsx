import { useMemo, useState } from "react";
import { Copy, Layers, Plus, Trash2 } from "lucide-react";
import { TextField } from "../../../components/forms/TextField";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { useReportDesignerStore } from "../../reports/reportDesigner.store";
import type { ReportElement } from "../../reports/reports.types";
import { CoverPageSettingsPanel } from "../../reports/components/CoverPageSettingsPanel";
import { FontControls } from "../../reports/components/FontControls";
import { PageSettingsPanel } from "../../reports/components/PageSettingsPanel";
import { REPORT_FIELD_DRAG_TYPE } from "../../reports/components/ReportPagePreview";
import type { ReportDesignBinding, StructuredOutputSchemaField } from "../reportDesigns.types";
import { getFieldTypeLabel } from "../reportDesigns.utils";

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-ink-700">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
      />
    </label>
  );
}

function ElementProperties({
  element,
  schemaFields,
  binding,
  onUpdateBinding,
  onDuplicate,
  onRemove,
}: {
  element: ReportElement;
  schemaFields: StructuredOutputSchemaField[];
  binding: ReportDesignBinding | null;
  onUpdateBinding: (componentId: string, updates: Partial<ReportDesignBinding>) => void;
  onDuplicate: (elementId: string) => void;
  onRemove: (elementId: string) => void;
}) {
  const updateElement = useReportDesignerStore((state) => state.updateElement);
  const selectedField = schemaFields.find((field) => field.path === (binding?.path ?? element.fieldKey));

  return (
    <div className="grid min-w-0 gap-5">
      <div>
        <p className="text-base font-semibold text-ink-950">Selected element</p>
        <p className="mt-1 break-all font-mono text-xs text-ink-500">{element.id}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberInput label="X" value={element.x} onChange={(value) => updateElement(element.id, { x: value })} />
        <NumberInput label="Y" value={element.y} onChange={(value) => updateElement(element.id, { y: value })} />
        <NumberInput label="Width" value={element.width} onChange={(value) => updateElement(element.id, { width: value })} />
        <NumberInput label="Height" value={element.height} onChange={(value) => updateElement(element.id, { height: value })} />
        <NumberInput label="Z-index" value={element.zIndex} onChange={(value) => updateElement(element.id, { zIndex: value })} />
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Locked</span>
          <select value={element.locked ? "yes" : "no"} onChange={(event) => updateElement(element.id, { locked: event.target.value === "yes" })} className="min-h-10 rounded-md border border-ink-300 px-3 py-2">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      </div>

      {element.type === "text" ? (
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Content</span>
          <textarea
            value={element.content ?? ""}
            onChange={(event) => updateElement(element.id, { content: event.target.value })}
            rows={4}
            className="min-w-0 rounded-md border border-ink-300 px-3 py-2"
          />
        </label>
      ) : null}

      {element.type === "field" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge tone="muted">Source: {binding?.sourceKey ?? selectedField?.sourceKey ?? "Not selected"}</Badge>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink-700">Schema field</span>
            <select
              value={binding?.path ?? element.fieldKey ?? ""}
              onChange={(event) => {
                const field = schemaFields.find((item) => item.path === event.target.value);
                updateElement(element.id, { fieldKey: event.target.value });
                onUpdateBinding(element.id, { path: event.target.value, sourceKey: field?.sourceKey ?? binding?.sourceKey });
              }}
              className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
            >
              {schemaFields.map((field) => (
                <option key={field.path} value={field.path}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink-700">Fallback</span>
            <input
              value={String(binding?.fallback ?? element.content ?? "")}
              onChange={(event) => {
                updateElement(element.id, { content: event.target.value });
                onUpdateBinding(element.id, { fallback: event.target.value });
              }}
              className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
            />
          </label>
        </>
      ) : null}

      {element.type === "table" ? (
        <>
          <TextField label="Label" value={element.content ?? ""} onChange={(event) => updateElement(element.id, { content: event.target.value })} />
          <TextField label="Source key" value={element.sourceKey ?? "case_analysis"} onChange={(event) => updateElement(element.id, { sourceKey: event.target.value })} />
          <TextField label="Array path" value={element.path ?? ""} onChange={(event) => updateElement(element.id, { path: event.target.value })} />
          <TextField label="Empty state" value={element.emptyState ?? ""} onChange={(event) => updateElement(element.id, { emptyState: event.target.value })} />
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink-700">Columns</p>
              <Button
                type="button"
                variant="secondary"
                className="min-h-8 px-2 py-1 text-xs"
                onClick={() => updateElement(element.id, { columns: [...(element.columns ?? []), { id: `column-${Date.now()}`, label: "Column", path: "" }] })}
              >
                Add column
              </Button>
            </div>
            {(element.columns ?? []).map((column, index) => (
              <div key={column.id} className="grid gap-2 rounded-md border border-ink-200 p-2">
                <TextField label="Column label" value={column.label} onChange={(event) => updateElement(element.id, { columns: (element.columns ?? []).map((item) => item.id === column.id ? { ...item, label: event.target.value } : item) })} />
                <TextField label="Column path" value={column.path} onChange={(event) => updateElement(element.id, { columns: (element.columns ?? []).map((item) => item.id === column.id ? { ...item, path: event.target.value } : item) })} />
                <TextField label="Fallback" value={String(column.fallback ?? "")} onChange={(event) => updateElement(element.id, { columns: (element.columns ?? []).map((item) => item.id === column.id ? { ...item, fallback: event.target.value } : item) })} />
                <TextField label="Format" value={column.format ?? ""} onChange={(event) => updateElement(element.id, { columns: (element.columns ?? []).map((item) => item.id === column.id ? { ...item, format: event.target.value } : item) })} />
                <Button type="button" variant="ghost" className="justify-start" onClick={() => updateElement(element.id, { columns: (element.columns ?? []).filter((_, columnIndex) => columnIndex !== index) })}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove column
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {element.type === "conditional" ? (
        <>
          <TextField label="Label" value={element.content ?? ""} onChange={(event) => updateElement(element.id, { content: event.target.value })} />
          <TextField label="Visibility source key" value={element.visibility?.sourceKey ?? "case_analysis"} onChange={(event) => updateElement(element.id, { visibility: { sourceKey: event.target.value, path: element.visibility?.path ?? "", operator: element.visibility?.operator ?? "exists", value: element.visibility?.value } })} />
          <TextField label="Visibility path" value={element.visibility?.path ?? ""} onChange={(event) => updateElement(element.id, { visibility: { sourceKey: element.visibility?.sourceKey ?? "case_analysis", path: event.target.value, operator: element.visibility?.operator ?? "exists", value: element.visibility?.value } })} />
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink-700">Operator</span>
            <select
              value={element.visibility?.operator ?? "exists"}
              onChange={(event) => updateElement(element.id, { visibility: { sourceKey: element.visibility?.sourceKey ?? "case_analysis", path: element.visibility?.path ?? "", operator: event.target.value as NonNullable<ReportElement["visibility"]>["operator"], value: element.visibility?.value } })}
              className="min-h-10 rounded-md border border-ink-300 px-3 py-2"
            >
              {["exists", "notEmpty", "equals", "notEquals", "greaterThan", "lessThan", "includes"].map((operator) => <option key={operator} value={operator}>{operator}</option>)}
            </select>
          </label>
          <TextField label="Compare value" value={String(element.visibility?.value ?? "")} onChange={(event) => updateElement(element.id, { visibility: { sourceKey: element.visibility?.sourceKey ?? "case_analysis", path: element.visibility?.path ?? "", operator: element.visibility?.operator ?? "exists", value: event.target.value } })} />
          <TextField label="Hidden label" value={element.emptyState ?? ""} onChange={(event) => updateElement(element.id, { emptyState: event.target.value })} />
        </>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberInput label="Font size" value={element.style.fontSize ?? 14} onChange={(value) => updateElement(element.id, { style: { fontSize: value } })} />
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Weight</span>
          <select value={element.style.fontWeight ?? "400"} onChange={(event) => updateElement(element.id, { style: { fontWeight: event.target.value } })} className="min-h-10 rounded-md border border-ink-300 px-3 py-2">
            <option value="400">Regular</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Color</span>
          <input type="color" value={element.style.color ?? "#18181b"} onChange={(event) => updateElement(element.id, { style: { color: event.target.value } })} className="h-10 min-w-0 rounded-md border border-ink-300 bg-white px-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Background</span>
          <input type="color" value={element.style.backgroundColor ?? "#ffffff"} onChange={(event) => updateElement(element.id, { style: { backgroundColor: event.target.value } })} className="h-10 min-w-0 rounded-md border border-ink-300 bg-white px-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Align</span>
          <select value={element.style.textAlign ?? "left"} onChange={(event) => updateElement(element.id, { style: { textAlign: event.target.value as ReportElement["style"]["textAlign"] } })} className="min-h-10 rounded-md border border-ink-300 px-3 py-2">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <NumberInput label="Radius" value={element.style.borderRadius ?? 0} onChange={(value) => updateElement(element.id, { style: { borderRadius: value } })} />
      </div>

      {element.type === "image" ? (
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Image fit</span>
          <select value={element.style.objectFit ?? "contain"} onChange={(event) => updateElement(element.id, { style: { objectFit: event.target.value as ReportElement["style"]["objectFit"] } })} className="min-h-10 rounded-md border border-ink-300 px-3 py-2">
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="fill">Fill</option>
          </select>
        </label>
      ) : null}

      <div className="grid gap-2">
        <Button type="button" variant="secondary" onClick={() => updateElement(element.id, { zIndex: element.zIndex + 1 })}>
          <Layers className="h-4 w-4" aria-hidden="true" />
          Bring Forward
        </Button>
        <Button type="button" variant="secondary" onClick={() => updateElement(element.id, { zIndex: Math.max(0, element.zIndex - 1) })}>
          <Layers className="h-4 w-4" aria-hidden="true" />
          Send Backward
        </Button>
        <Button type="button" variant="secondary" onClick={() => onDuplicate(element.id)}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Duplicate
        </Button>
        <Button type="button" variant="danger" onClick={() => onRemove(element.id)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete Element
        </Button>
      </div>
    </div>
  );
}

function titleFromPathSegment(segment: string) {
  return segment
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || "Policy";
}

function getFieldSection(field: StructuredOutputSchemaField) {
  const [section] = field.path.split(".");
  return titleFromPathSegment(section || "policy");
}

function PolicySchemaMappings({
  schemaFields,
  bindings,
  activePage,
  disabledReason,
  onAddField,
  onAddFields,
  onAddTable,
  onAddRepeater,
}: {
  schemaFields: StructuredOutputSchemaField[];
  bindings: ReportDesignBinding[];
  activePage: string;
  disabledReason?: string;
  onAddField: (field: StructuredOutputSchemaField) => void;
  onAddFields: (fields: StructuredOutputSchemaField[]) => void;
  onAddTable: (field: StructuredOutputSchemaField) => void;
  onAddRepeater: (field: StructuredOutputSchemaField) => void;
}) {
  const template = useReportDesignerStore((state) => state.template);
  const [search, setSearch] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => new Set());
  const mappedPaths = useMemo(() => new Set(bindings.map((binding) => binding.path)), [bindings]);
  const mappedPathsOnActivePage = useMemo(() => {
    const componentPages = new Map(template.coverPage.elements.map((element) => [element.id, element.page || "cover"]));
    return new Set(bindings.filter((binding) => componentPages.get(binding.componentId) === activePage).map((binding) => binding.path));
  }, [activePage, bindings, template.coverPage.elements]);
  const normalizedSearch = search.trim().toLowerCase();
  const groupedFields = useMemo(() => {
    const groups = new Map<string, StructuredOutputSchemaField[]>();

    for (const field of schemaFields) {
      if (normalizedSearch && ![field.label, field.path, field.description, field.type].join(" ").toLowerCase().includes(normalizedSearch)) {
        continue;
      }

      const section = getFieldSection(field);
      groups.set(section, [...(groups.get(section) ?? []), field]);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [normalizedSearch, schemaFields]);
  const selectedFields = useMemo(() => schemaFields.filter((field) => selectedPaths.has(field.path)), [schemaFields, selectedPaths]);

  const toggleSelectedPath = (path: string) => {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedPaths(new Set());

  const getDragPaths = (field: StructuredOutputSchemaField) => {
    if (selectedPaths.has(field.path) && selectedPaths.size > 0) return Array.from(selectedPaths);
    return [field.path];
  };

  if (disabledReason || !schemaFields.length) {
    return (
      <div className="rounded-md border border-dashed border-ink-300 bg-ink-50 px-3 py-4 text-sm text-ink-500">
        {disabledReason ?? "No fields are available for this data source and schema."}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      <TextField label="Search policy schema" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter fields" />

      {selectedPaths.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-ink-200 bg-ink-50 p-2">
          <Badge tone="outline">{selectedPaths.size} selected</Badge>
          <Button type="button" variant="secondary" className="min-h-8 px-2 py-1 text-xs" onClick={() => onAddFields(selectedFields)} disabled={selectedFields.length === 0}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add selected
          </Button>
          <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      ) : null}

      {groupedFields.length ? (
        groupedFields.map(([section, fields]) => (
          <div key={section} className="min-w-0 rounded-md border border-ink-200">
            <div className="flex items-center justify-between gap-3 border-b border-ink-200 bg-ink-50 px-3 py-2">
              <p className="min-w-0 break-words text-sm font-semibold text-ink-950">{section}</p>
              <Badge tone="muted">{fields.length}</Badge>
            </div>
            <div className="grid gap-2 p-3">
              {fields.map((field) => {
                const mappedHere = mappedPathsOnActivePage.has(field.path);
                const mappedElsewhere = !mappedHere && mappedPaths.has(field.path);
                const selected = selectedPaths.has(field.path);

                return (
                  <div
                    key={field.path}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "copy";
                      event.dataTransfer.setData(REPORT_FIELD_DRAG_TYPE, JSON.stringify(getDragPaths(field)));
                      event.dataTransfer.setData("text/plain", getDragPaths(field).join("\n"));
                    }}
                    className="min-w-0 cursor-grab rounded-md border border-ink-200 bg-white p-3 active:cursor-grabbing"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelectedPath(field.path)}
                        className="mt-1 h-4 w-4 shrink-0 accent-ink-950"
                        aria-label={`Select ${field.label}`}
                      />
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-xs font-semibold text-ink-800">{field.label}</p>
                            <p className="mt-1 break-all font-mono text-[11px] text-ink-500">{field.path}</p>
                        <p className="mt-2 text-[11px] font-medium text-ink-500">{getFieldTypeLabel(field)}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {field.sourceKey ? <Badge tone="muted">{field.sourceKey}</Badge> : null}
                            {mappedHere ? <Badge tone="outline">Mapped here</Badge> : mappedElsewhere ? <Badge tone="muted">Other page</Badge> : null}
                          </div>
                        </div>
                        {field.description ? <p className="mt-2 break-words text-xs text-ink-500">{field.description}</p> : null}
                        <div className="mt-3 grid gap-2">
                          <Button type="button" variant="secondary" className="w-full justify-start" onClick={() => onAddField(field)}>
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {field.array ? "Add as text/list" : "Add to page"}
                          </Button>
                          {field.array || field.supportsTable ? (
                            <Button type="button" variant="secondary" className="w-full justify-start" onClick={() => onAddTable(field)}>
                              <Plus className="h-4 w-4" aria-hidden="true" />
                              Add as table
                            </Button>
                          ) : null}
                          {field.array || field.supportsRepeater ? (
                            <Button type="button" variant="secondary" className="w-full justify-start" onClick={() => onAddRepeater(field)}>
                              <Plus className="h-4 w-4" aria-hidden="true" />
                              Add as repeater
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-ink-500">No matching policy fields found.</p>
      )}
    </div>
  );
}

export function AdminReportPropertiesPanel({
  schemaFields,
  bindings,
  activePage,
  bindingDisabledReason,
  onAddField,
  onAddFields,
  onAddTable,
  onAddRepeater,
  onUpdateBinding,
  onDuplicate,
  onRemove,
}: {
  schemaFields: StructuredOutputSchemaField[];
  bindings: ReportDesignBinding[];
  activePage: string;
  bindingDisabledReason?: string;
  onAddField: (field: StructuredOutputSchemaField) => void;
  onAddFields: (fields: StructuredOutputSchemaField[]) => void;
  onAddTable: (field: StructuredOutputSchemaField) => void;
  onAddRepeater: (field: StructuredOutputSchemaField) => void;
  onUpdateBinding: (componentId: string, updates: Partial<ReportDesignBinding>) => void;
  onDuplicate: (elementId: string) => void;
  onRemove: (elementId: string) => void;
}) {
  const template = useReportDesignerStore((state) => state.template);
  const selectedElementId = useReportDesignerStore((state) => state.selectedElementId);
  const updatePage = useReportDesignerStore((state) => state.updatePage);
  const updateTheme = useReportDesignerStore((state) => state.updateTheme);
  const updateCover = useReportDesignerStore((state) => state.updateCover);
  const selectedElement = template.coverPage.elements.find((element) => element.id === selectedElementId);
  const binding = bindings.find((item) => item.componentId === selectedElementId) ?? null;

  return (
    <aside className="min-w-0 overflow-y-auto bg-white p-5">
      {selectedElement ? (
        <ElementProperties
          element={selectedElement}
          schemaFields={schemaFields}
          binding={binding}
          onUpdateBinding={onUpdateBinding}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
      ) : (
        <div className="grid min-w-0 gap-6">
          <section className="min-w-0 rounded-xl border border-ink-200 bg-white p-4 shadow-soft">
            <h2 className="text-base font-semibold text-ink-950">Page settings</h2>
            <div className="mt-4">
              <PageSettingsPanel page={template.page} onChange={updatePage} />
            </div>
          </section>
          <section className="min-w-0 rounded-xl border border-ink-200 bg-white p-4 shadow-soft">
            <h2 className="text-base font-semibold text-ink-950">Theme</h2>
            <div className="mt-4">
              <FontControls theme={template.theme} onChange={updateTheme} />
            </div>
          </section>
          <section className="min-w-0 rounded-xl border border-ink-200 bg-white p-4 shadow-soft">
            <h2 className="text-base font-semibold text-ink-950">Cover page</h2>
            <div className="mt-4">
              <CoverPageSettingsPanel coverPage={template.coverPage} onChange={updateCover} />
            </div>
          </section>
          <section className="min-w-0 rounded-xl border border-ink-200 bg-white p-4 shadow-soft">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink-950">Policy schema</h2>
                <p className="mt-1 text-xs text-ink-500">Map schema sections and fields onto the report canvas.</p>
              </div>
              <Badge tone="muted">{bindings.length} mapped</Badge>
            </div>
            <div className="mt-4">
              <PolicySchemaMappings schemaFields={schemaFields} bindings={bindings} activePage={activePage} disabledReason={bindingDisabledReason} onAddField={onAddField} onAddFields={onAddFields} onAddTable={onAddTable} onAddRepeater={onAddRepeater} />
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
