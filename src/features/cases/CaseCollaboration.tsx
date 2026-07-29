import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { formatDate } from "../../lib/dates";
import { ApiError } from "../../lib/api";
import { createCaseComment, getCaseComments } from "./cases.api";

function authorLabel(author: unknown) {
  if (author && typeof author === "object" && "name" in author && typeof author.name === "string") return author.name;
  return "Case participant";
}

export function CaseCollaboration({ caseId }: { caseId: string }) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const commentsQuery = useQuery({ queryKey: ["case-comments", caseId], queryFn: () => getCaseComments(caseId), enabled: Boolean(caseId) });
  const createMutation = useMutation({
    mutationFn: () => createCaseComment(caseId, body.trim()),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["case-comments", caseId] });
    },
  });

  return (
    <section className="space-y-4">
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (body.trim()) createMutation.mutate(); }}>
        <label className="sr-only" htmlFor="case-comment">Add a case comment</label>
        <textarea id="case-comment" value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} placeholder="Add a comment or follow-up detail…" className="min-h-24 w-full border border-ink-300 bg-white px-3 py-2 text-sm focus:border-ink-950 focus:outline-none focus:ring-2 focus:ring-ink-200" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-500">{body.length}/4000</span>
          <Button type="submit" isLoading={createMutation.isPending} disabled={!body.trim()}>
            <Send className="h-4 w-4" aria-hidden="true" /> Add comment
          </Button>
        </div>
      </form>
      {createMutation.isError ? <Alert tone="error">{createMutation.error instanceof ApiError ? createMutation.error.message : "Unable to add your comment."}</Alert> : null}
      {commentsQuery.isLoading ? <div className="space-y-3"><LoadingSkeleton className="h-16" /><LoadingSkeleton className="h-16" /></div> : null}
      {commentsQuery.isError ? <Alert tone="error">Unable to load comments. <button type="button" className="underline" onClick={() => void commentsQuery.refetch()}>Try again</button></Alert> : null}
      {!commentsQuery.isLoading && !commentsQuery.isError && (commentsQuery.data?.length ?? 0) === 0 ? <div className="flex gap-3 border border-dashed border-ink-300 p-4 text-sm text-ink-600"><MessageSquare className="h-5 w-5 shrink-0" aria-hidden="true" /> No comments yet. Use this space to share missing information or next steps.</div> : null}
      <div className="space-y-3">
        {(commentsQuery.data ?? []).map((comment) => <article key={comment._id} className="border-l-2 border-ink-300 bg-ink-50/60 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500"><span className="font-medium text-ink-700">{authorLabel(comment.authorId)}</span><time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time></div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-800">{comment.body}</p>
        </article>)}
      </div>
    </section>
  );
}
