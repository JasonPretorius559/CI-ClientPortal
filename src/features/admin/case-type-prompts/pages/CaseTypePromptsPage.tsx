import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePlus2, PencilLine, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert } from "../../../../components/ui/Alert";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { useToast } from "../../../../components/ui/toast-context";
import { formatDate } from "../../../../lib/dates";
import { AdminPageAccess } from "../../AdminPageAccess";
import {
  deleteCaseTypePrompt,
  getCaseTypePromptId,
  listCaseTypePrompts,
} from "../caseTypePrompts.api";

function previewPrompt(prompt: string) {
  const trimmed = prompt.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 180) return trimmed || "No prompt text.";
  return `${trimmed.slice(0, 180)}...`;
}

export function CaseTypePromptsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const promptsQuery = useQuery({
    queryKey: ["admin", "case-type-prompts"],
    queryFn: listCaseTypePrompts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCaseTypePrompt,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "case-type-prompts"],
      });
      showToast({ tone: "success", title: "Case type prompt deleted." });
    },
    onError: (error) => {
      showToast({
        tone: "error",
        title:
          error instanceof Error
            ? error.message
            : "Unable to delete this prompt.",
      });
    },
  });

  const prompts = promptsQuery.data ?? [];

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="Case Type Prompts"
          description="Manage the prompts used when cases are analysed for each case type and linked case type."
          action={
            <Button asChild>
              <Link to="/admin/setup/case-type-prompts/new">
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                New Prompt
              </Link>
            </Button>
          }
        />

        {promptsQuery.isLoading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-12" />
            <LoadingSkeleton className="h-80" />
          </div>
        ) : null}

        {promptsQuery.isError ? (
          <ErrorState
            title="Unable to load case type prompts"
            message={
              promptsQuery.error instanceof Error
                ? promptsQuery.error.message
                : "Case type prompts could not be loaded."
            }
            onRetry={() => void promptsQuery.refetch()}
          />
        ) : null}

        {!promptsQuery.isLoading &&
        !promptsQuery.isError &&
        prompts.length === 0 ? (
          <EmptyState
            title="No case type prompts yet"
            description="Create prompts so analysis jobs can use the right instructions for each case setup."
            action={
              <Button asChild>
                <Link to="/admin/setup/case-type-prompts/new">
                  Create prompt
                </Link>
              </Button>
            }
          />
        ) : null}

        {!promptsQuery.isLoading &&
        !promptsQuery.isError &&
        prompts.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
            {deleteMutation.isError ? (
              <Alert tone="error" className="m-4">
                {deleteMutation.error instanceof Error
                  ? deleteMutation.error.message
                  : "Unable to delete this prompt."}
              </Alert>
            ) : null}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 text-sm">
                <thead className="bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Case Type</th>
                    <th className="px-4 py-3">Linked Case Type</th>
                    <th className="px-4 py-3">Prompt</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {prompts.map((prompt) => {
                    const id = getCaseTypePromptId(prompt);
                    return (
                      <tr key={id}>
                        <td className="px-4 py-4 font-medium text-ink-950">
                          {prompt.caseTypeName || "Unknown"}
                        </td>
                        <td className="px-4 py-4 text-ink-700">
                          {prompt.linkedCaseTypeName || "Fallback"}
                        </td>
                        <td className="max-w-xl px-4 py-4 text-ink-600">
                          {previewPrompt(prompt.prompt)}
                        </td>
                        <td className="px-4 py-4 text-ink-700">
                          v{prompt.version}
                        </td>
                        <td className="px-4 py-4">
                          <Badge tone={prompt.isActive ? "outline" : "dashed"}>
                            {prompt.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-ink-600">
                          {formatDate(prompt.updatedAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              asChild
                              variant="secondary"
                              className="px-3"
                            >
                              <Link
                                to={`/admin/setup/case-type-prompts/${encodeURIComponent(id)}`}
                                aria-label="Edit case type prompt"
                              >
                                <PencilLine
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </Link>
                            </Button>
                            <Button
                              variant="danger"
                              className="px-3"
                              aria-label="Delete case type prompt"
                              disabled={!id || deleteMutation.isPending}
                              isLoading={deleteMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Delete this case type prompt?",
                                  )
                                )
                                  deleteMutation.mutate(id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </AdminPageAccess>
  );
}
