import { Save } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function TemplateSaveBar({
  dirty,
  saving,
  onSave,
  onPreview,
  onGenerate,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onPreview: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-ink-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-950">Report Designer</p>
        <p className="mt-0.5 text-xs text-ink-500">{dirty ? "Unsaved changes" : "All changes saved"}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onPreview}>
          Preview
        </Button>
        <Button type="button" variant="secondary" onClick={onGenerate}>
          Generate report
        </Button>
        <Button type="button" onClick={onSave} isLoading={saving}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Template
        </Button>
      </div>
    </div>
  );
}
