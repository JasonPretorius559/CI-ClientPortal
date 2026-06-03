import { Copy, Layers, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useReportDesignerStore } from "../reportDesigner.store";
import { builtInReportFields } from "../reportTemplate.defaults";
import type { ReportElement } from "../reports.types";
import { CoverPageSettingsPanel } from "./CoverPageSettingsPanel";
import { FontControls } from "./FontControls";
import { PageSettingsPanel } from "./PageSettingsPanel";
import { SectionOrderEditor } from "./SectionOrderEditor";

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

function ElementProperties({ element }: { element: ReportElement }) {
  const updateElement = useReportDesignerStore((state) => state.updateElement);
  const removeElement = useReportDesignerStore((state) => state.removeElement);
  const duplicateElement = useReportDesignerStore((state) => state.duplicateElement);

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
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Field key</span>
          <select value={element.fieldKey ?? ""} onChange={(event) => updateElement(element.id, { fieldKey: event.target.value })} className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2">
            {builtInReportFields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
        </label>
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
        <Button type="button" variant="secondary" onClick={() => duplicateElement(element.id)}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Duplicate
        </Button>
        <Button type="button" variant="danger" onClick={() => removeElement(element.id)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete Element
        </Button>
      </div>
    </div>
  );
}

export function ReportPropertiesPanel() {
  const template = useReportDesignerStore((state) => state.template);
  const selectedElementId = useReportDesignerStore((state) => state.selectedElementId);
  const updatePage = useReportDesignerStore((state) => state.updatePage);
  const updateTheme = useReportDesignerStore((state) => state.updateTheme);
  const updateCover = useReportDesignerStore((state) => state.updateCover);
  const selectedElement = template.coverPage.elements.find((element) => element.id === selectedElementId);

  return (
    <aside className="min-w-0 overflow-y-auto bg-white p-5">
      {selectedElement ? (
        <ElementProperties element={selectedElement} />
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
            <h2 className="text-base font-semibold text-ink-950">Sections</h2>
            <div className="mt-4">
              <SectionOrderEditor />
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
