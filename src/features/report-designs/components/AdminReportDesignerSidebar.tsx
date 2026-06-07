import { Image, ImagePlus, Square, Type } from "lucide-react";
import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { SelectField } from "../../../components/forms/SelectField";
import { TextareaField } from "../../../components/forms/TextareaField";
import { TextField } from "../../../components/forms/TextField";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { useReportDesignerStore } from "../../reports/reportDesigner.store";
import { uploadReportAsset } from "../../reports/reports.api";
import { getReportAssetId } from "../../reports/reports.types";
import type { ReportDataSource, StructuredOutputSchema } from "../reportDesigns.types";
import { getSchemaDisplayName } from "../reportDesigns.utils";

export function AdminReportDesignerSidebar({
  designName,
  description,
  schemas,
  dataSources,
  schemaKey,
  sourceKey,
  schemaVersion,
  schemaSelected,
  isEditing,
  onNameChange,
  onDescriptionChange,
  onSchemaChange,
  onSourceChange,
}: {
  designName: string;
  description: string;
  schemas: StructuredOutputSchema[];
  dataSources: ReportDataSource[];
  schemaKey: string;
  sourceKey: string;
  schemaVersion: number | null;
  schemaSelected: boolean;
  isEditing: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSchemaChange: (value: string) => void;
  onSourceChange: (value: string) => void;
}) {
  const template = useReportDesignerStore((state) => state.template);
  const activePage = useReportDesignerStore((state) => state.activePage);
  const addElement = useReportDesignerStore((state) => state.addElement);
  const addAsset = useReportDesignerStore((state) => state.addAsset);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedSchema = schemas.find((schema) => schema.key === schemaKey);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadReportAsset(file, template.id ?? template._id),
    onSuccess: (asset) => {
      addAsset(asset);
      addElement({
        type: "image",
        page: activePage,
        x: 96,
        y: 260,
        width: 220,
        height: 140,
        zIndex: template.coverPage.elements.length + 1,
        assetId: getReportAssetId(asset),
        style: { objectFit: "contain", borderRadius: 8 },
      });
    },
  });

  const nextZIndex = template.coverPage.elements.length + 1;

  return (
    <aside className="min-w-0 overflow-y-auto bg-white p-5">
      <div className="min-w-0 rounded-lg border border-ink-200 bg-ink-50 p-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-950">Report setup</p>
            <p className="mt-1 text-xs text-ink-500">Name and schema saved with this design.</p>
          </div>
          {schemaVersion !== null ? <Badge tone="muted">v{schemaVersion}</Badge> : null}
        </div>

        <div className="mt-3 grid gap-3">
          <TextField
            label="Name"
            value={designName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Commercial ROA Template"
          />

          {isEditing ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink-800">Schema</p>
              <div className="flex flex-wrap gap-2 rounded-md border border-ink-200 bg-white px-3 py-2">
                <Badge tone="outline">{getSchemaDisplayName(selectedSchema, schemaKey)}</Badge>
              </div>
            </div>
          ) : (
            <SelectField
              label="Schema"
              value={schemaKey}
              onChange={(event) => onSchemaChange(event.target.value)}
              options={[
                { label: "Select a schema", value: "" },
                ...schemas.map((schema) => ({
                  label: schema.version ? `${schema.name} (v${schema.version})` : schema.name,
                  value: schema.key,
                })),
              ]}
            />
          )}

          <SelectField
            label="Data source"
            value={sourceKey}
            onChange={(event) => onSourceChange(event.target.value)}
            options={[
              { label: "Select a source", value: "" },
              ...dataSources.map((source) => ({
                label: source.name,
                value: source.key,
              })),
            ]}
          />

          <TextareaField
            label="Description"
            rows={3}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Optional report design notes"
            className="min-h-20"
          />

          <div className="flex flex-wrap gap-2">
            <Badge tone="muted">{template.coverPage.elements.length} elements</Badge>
            {schemaSelected ? <Badge tone="outline">Schema selected</Badge> : <Badge tone="dashed">Schema required</Badge>}
            {sourceKey ? <Badge tone="outline">Source selected</Badge> : <Badge tone="dashed">Source required</Badge>}
          </div>
        </div>
      </div>

      <div className="mt-6 min-w-0">
        <p className="text-base font-semibold text-ink-950">Toolbox</p>
        <p className="mt-1 text-sm text-ink-500">
          {schemaSelected ? "Add visual elements to the canvas." : "Select a schema before mapping fields."}
        </p>
      </div>

      <div className="mt-5 grid gap-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start"
          onClick={() =>
            addElement({
              type: "text",
              page: activePage,
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
              type: "shape",
              page: activePage,
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

        <div className="min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadMutation.mutate(file);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="secondary" className="w-full justify-start" isLoading={uploadMutation.isPending} onClick={() => inputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Upload Image
          </Button>
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
