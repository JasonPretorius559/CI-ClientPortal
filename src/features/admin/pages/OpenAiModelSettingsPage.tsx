import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { SelectField } from "../../../components/forms/SelectField";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../components/ui/toast-context";
import { formatDate } from "../../../lib/dates";
import { AdminPageAccess } from "../AdminPageAccess";
import { getOpenAiModelSettings, updateOpenAiModelSettings } from "../openAiModelSettings.api";

export function OpenAiModelSettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedModelError, setSelectedModelError] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["admin", "masterfiles", "openai-model-settings"],
    queryFn: getOpenAiModelSettings,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setSelectedModel(settingsQuery.data.selectedModel || "");
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nextError = selectedModel.trim() ? "" : "Selected model is required.";
      setSelectedModelError(nextError);

      if (nextError) {
        throw new Error("Please choose a model before saving.");
      }

      const allowedModels = settingsQuery.data?.allowedModels ?? [];

      return updateOpenAiModelSettings({
        selectedModel: selectedModel.trim(),
        allowedModels,
      });
    },
    onSuccess: async (data) => {
      setSelectedModel(data.selectedModel);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "masterfiles", "openai-model-settings"],
      });
      showToast({ tone: "success", title: "OpenAI model settings updated." });
    },
    onError: (error) => {
      showToast({
        tone: "error",
        title:
          error instanceof Error
            ? error.message
            : "Unable to update OpenAI model settings.",
      });
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <AdminPageAccess>
        <div className="space-y-6">
          <LoadingSkeleton className="h-16" />
          <LoadingSkeleton className="h-80" />
        </div>
      </AdminPageAccess>
    );
  }

  if (settingsQuery.isError) {
    return (
      <AdminPageAccess>
        <ErrorState
          title="Unable to load OpenAI model settings"
          message={
            settingsQuery.error instanceof Error
              ? settingsQuery.error.message
              : "The OpenAI model settings could not be loaded."
          }
          onRetry={() => void settingsQuery.refetch()}
        />
      </AdminPageAccess>
    );
  }

  const settings = settingsQuery.data;
  const allowedModels = settings?.allowedModels ?? [];

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="OpenAI Model Settings"
          description="Choose the default OpenAI model used for analysis when no case-specific override is sent."
          action={(
            <Button
              type="button"
              isLoading={saveMutation.isPending}
              disabled={!allowedModels.length}
              onClick={() => saveMutation.mutate()}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </Button>
          )}
        />

        {saveMutation.isError ? (
          <Alert tone="error">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Unable to save OpenAI model settings."}
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Default Analysis Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SelectField
              label="Selected model"
              value={selectedModel}
              error={selectedModelError}
              disabled={!allowedModels.length || saveMutation.isPending}
              onChange={(event) => {
                setSelectedModel(event.target.value);
                if (event.target.value.trim()) setSelectedModelError("");
              }}
              options={[
                {
                  label: allowedModels.length ? "Select model" : "No models available",
                  value: "",
                },
                ...allowedModels.map((model) => ({
                  label: model,
                  value: model,
                })),
              ]}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
                <span className="block text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Source
                </span>
                <span className="mt-1 block">
                  {settings?.source === "database" ? "Database" : "Fallback"}
                </span>
              </div>
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
                <span className="block text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Version
                </span>
                <span className="mt-1 block">{settings?.version ?? 0}</span>
              </div>
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
                <span className="block text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Last Updated
                </span>
                <span className="mt-1 block">{formatDate(settings?.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </AdminPageAccess>
  );
}
