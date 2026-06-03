import { Badge } from "../../components/ui/Badge";
import { formatCaseStatus, getStatusGroup } from "./cases.utils";
import { AlertTriangle, Check, Circle, Clock3, HelpCircle, Loader2 } from "lucide-react";

export function CaseStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const group = getStatusGroup(status);
  const isPending = normalized.includes("pending");
  const isProcessing = normalized.includes("processing") || normalized.includes("in_progress") || normalized.includes("in progress");
  const isFailed = normalized.includes("failed") || normalized.includes("rejected");

  if (group === "completed") {
    return (
      <Badge tone="solid">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        {formatCaseStatus(status)}
      </Badge>
    );
  }

  if (isFailed) {
    return (
      <Badge className="bg-ink-900 text-white" tone="solid">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        {formatCaseStatus(status)}
      </Badge>
    );
  }

  if (group === "attention") {
    return (
      <Badge tone="attention">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        {formatCaseStatus(status)}
      </Badge>
    );
  }

  if (isProcessing) {
    return (
      <Badge tone="dashed">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        {formatCaseStatus(status)}
      </Badge>
    );
  }

  if (isPending) {
    return (
      <Badge tone="dashed">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {formatCaseStatus(status)}
      </Badge>
    );
  }

  if (group === "open") {
    return (
      <Badge tone="outline">
        <Circle className="h-3 w-3" aria-hidden="true" />
        {formatCaseStatus(status)}
      </Badge>
    );
  }

  return (
    <Badge tone="muted">
      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {formatCaseStatus(status)}
    </Badge>
  );
}
