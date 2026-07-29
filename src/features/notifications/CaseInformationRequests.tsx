import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Send } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { formatDate } from "../../lib/dates";
import { createInformationRequest, listInformationRequests, respondToInformationRequest } from "./notifications.api";
import type { InformationRequest } from "./notifications.types";
import { useAuth } from "../auth/useAuth";
import { isAdminUser } from "../auth/auth.utils";

function RequestCard({ item, caseId }: { item: InformationRequest; caseId: string }) {
  const [responseText, setResponseText] = useState("");
  const queryClient = useQueryClient();
  const respond = useMutation({
    mutationFn: () => respondToInformationRequest(item._id, responseText),
    onSuccess: () => {
      setResponseText("");
      void queryClient.invalidateQueries({ queryKey: ["information-requests", caseId] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <article className="rounded-2xl border border-surface-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-950">{item.subject}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-600">{item.message}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
          <CalendarClock className="h-3.5 w-3.5" />Due {formatDate(item.dueAt)}
        </span>
      </div>
      {item.status === "open" ? (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="sr-only">Response to {item.subject}</span>
            <textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              rows={3}
              placeholder="Add the requested information or explain where it was uploaded"
              className="w-full rounded-xl border border-surface-line bg-white px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100"
            />
          </label>
          <Button disabled={!responseText.trim()} isLoading={respond.isPending} onClick={() => respond.mutate()}>
            <Send className="h-4 w-4" />Send response
          </Button>
          {respond.isError ? <p className="text-sm font-medium text-danger-700">The response could not be saved. Please try again.</p> : null}
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-success-700">
          <CheckCircle2 className="h-4 w-4" />Responded {item.respondedAt ? formatDate(item.respondedAt) : ""}
        </p>
      )}
    </article>
  );
}

export function CaseInformationRequests({ caseId }: { caseId: string }) {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [dueAt, setDueAt] = useState("");
  const query = useQuery({
    queryKey: ["information-requests", caseId, isAdmin],
    queryFn: () => listInformationRequests(caseId, isAdmin),
  });
  const create = useMutation({
    mutationFn: () => createInformationRequest({ caseId, subject, message, dueAt: new Date(dueAt).toISOString() }),
    onSuccess: () => {
      setSubject("");
      setMessage("");
      setDueAt("");
      void queryClient.invalidateQueries({ queryKey: ["information-requests", caseId] });
    },
  });
  if (!isAdmin && !query.data?.items.length) return null;

  return (
    <section className="space-y-3">
      {isAdmin ? (
        <div className="grid gap-3 rounded-2xl border border-surface-line bg-surface-canvas p-4 sm:grid-cols-2">
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Request subject" className="min-h-11 rounded-xl border border-surface-line bg-white px-3.5 text-sm outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100" />
          <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} aria-label="Information request due date" className="min-h-11 rounded-xl border border-surface-line bg-white px-3.5 text-sm outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100" />
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="What information is needed?" className="rounded-xl border border-surface-line bg-white px-3.5 py-3 text-sm outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100 sm:col-span-2" />
          <div className="sm:col-span-2">
            <Button disabled={!subject.trim() || !message.trim() || !dueAt} isLoading={create.isPending} onClick={() => create.mutate()}>
              <Send className="h-4 w-4" />Request information
            </Button>
            {create.isError ? <p className="mt-2 text-sm font-medium text-danger-700">The request could not be created. Check the due date and try again.</p> : null}
          </div>
        </div>
      ) : null}
      {query.data?.items.map((item) => <RequestCard key={item._id} item={item} caseId={caseId} />)}
    </section>
  );
}
