import { CopyPlus, Image, Square, Type } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useReportDesignerStore } from "../reportDesigner.store";
import { builtInReportFields } from "../reportTemplate.defaults";
import { ImageUploadControl } from "./ImageUploadControl";

export function ReportDesignerSidebar() {
  const template = useReportDesignerStore((state) => state.template);
  const addElement = useReportDesignerStore((state) => state.addElement);

  const nextZIndex = template.coverPage.elements.length + 1;

  return (
    <aside className="min-w-0 overflow-y-auto bg-white p-5">
      <div className="min-w-0">
        <p className="text-base font-semibold text-ink-950">Toolbox</p>
        <p className="mt-1 text-sm text-ink-500">Build the cover page, then configure report sections.</p>
      </div>

      <div className="mt-5 grid gap-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start"
          onClick={() =>
            addElement({
              type: "text",
              page: "cover",
              x: 80,
              y: 240,
              width: 260,
              height: 64,
              zIndex: nextZIndex,
              content: "New text block",
              style: { fontSize: 18, color: template.theme.textColor, fontWeight: "600" },
            })
          }
        >
          <Type className="h-4 w-4" aria-hidden="true" />
          Text
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start"
          onClick={() =>
            addElement({
              type: "field",
              page: "cover",
              x: 80,
              y: 320,
              width: 240,
              height: 40,
              zIndex: nextZIndex,
              fieldKey: "clientName",
              style: { fontSize: 16, color: template.theme.accentColor, fontWeight: "600" },
            })
          }
        >
          <CopyPlus className="h-4 w-4" aria-hidden="true" />
          Field
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start"
          onClick={() =>
            addElement({
              type: "shape",
              page: "cover",
              x: 80,
              y: 390,
              width: 180,
              height: 64,
              zIndex: nextZIndex,
              style: { backgroundColor: template.theme.accentColor, borderRadius: 10, opacity: 0.12 },
            })
          }
        >
          <Square className="h-4 w-4" aria-hidden="true" />
          Shape
        </Button>
        <ImageUploadControl />
      </div>

      <div className="mt-8 min-w-0">
        <p className="text-sm font-semibold text-ink-950">Available fields</p>
        <div className="mt-3 grid gap-2">
          {builtInReportFields.map((field) => (
            <button
              key={field.key}
              type="button"
              onClick={() =>
                addElement({
                  type: "field",
                  page: "cover",
                  x: 80,
                  y: 320,
                  width: 260,
                  height: 36,
                  zIndex: nextZIndex,
                  fieldKey: field.key,
                  style: { fontSize: 14, color: template.theme.textColor, fontWeight: "600" },
                })
              }
              className="min-w-0 rounded-md border border-ink-200 px-3 py-2 text-left text-xs font-semibold text-ink-700 transition hover:border-ink-500"
            >
              <span className="block break-words">{field.label}</span>
              <span className="mt-1 block break-all font-mono text-[11px] text-ink-500">{field.key}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 min-w-0">
        <p className="text-sm font-semibold text-ink-950">Assets</p>
        <div className="mt-3 grid gap-2">
          {(template.assets ?? []).length ? (
            template.assets?.map((asset, index) => (
              <div key={`${asset.id ?? asset._id ?? index}`} className="min-w-0 rounded-md border border-ink-200 bg-ink-50 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Image className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
                  <p className="min-w-0 break-all text-xs font-semibold text-ink-700">{asset.name ?? asset.fileName ?? asset.originalName ?? "Uploaded asset"}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-500">No images uploaded yet.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
