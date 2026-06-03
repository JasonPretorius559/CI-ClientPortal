import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useReportDesignerStore } from "../reportDesigner.store";
import { uploadReportAsset } from "../reports.api";
import { getReportAssetId } from "../reports.types";

export function ImageUploadControl() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const template = useReportDesignerStore((state) => state.template);
  const addAsset = useReportDesignerStore((state) => state.addAsset);
  const addElement = useReportDesignerStore((state) => state.addElement);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadReportAsset(file, template.id ?? template._id),
    onSuccess: (asset) => {
      addAsset(asset);
      addElement({
        type: "image",
        page: "cover",
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

  return (
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
      <Button type="button" variant="secondary" className="w-full" isLoading={uploadMutation.isPending} onClick={() => inputRef.current?.click()}>
        <ImagePlus className="h-4 w-4" aria-hidden="true" />
        Upload Image
      </Button>
      {uploadMutation.isError ? (
        <p className="mt-2 break-words text-xs text-ink-600">
          {uploadMutation.error instanceof Error ? uploadMutation.error.message : "Unable to upload image."}
        </p>
      ) : null}
    </div>
  );
}
