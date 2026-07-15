import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../../lib/api";
import {
  normalizeActiveAnalysisProgress,
  type ActiveAnalysisProgress,
} from "./analysisProgress.api";

export type AnalysisStreamStatus = "connecting" | "open" | "reconnecting" | "closed";

let streamStatus: AnalysisStreamStatus = "closed";
const statusListeners = new Set<() => void>();

function setStreamStatus(next: AnalysisStreamStatus) {
  if (streamStatus === next) return;
  streamStatus = next;
  for (const listener of statusListeners) listener();
}

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function useAnalysisStreamStatus() {
  return useSyncExternalStore(subscribeStatus, () => streamStatus, () => "closed");
}

function parseEventData(event: MessageEvent) {
  try {
    return JSON.parse(event.data) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTerminal(item: ActiveAnalysisProgress) {
  return ["completed", "failed", "cancelled", "timed_out"].includes(item.status) ||
    ["completed", "failed", "cancelled", "timed_out", "extraction_failed"].includes(item.stage);
}

export function AnalysisProgressStreamBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    setStreamStatus("connecting");
    const source = new EventSource(`${API_BASE_URL}/api/auth/analysis-progress/events`, {
      withCredentials: true,
    });

    source.onopen = () => setStreamStatus("open");
    source.onerror = () => setStreamStatus("reconnecting");

    source.addEventListener("snapshot", (event) => {
      const items = normalizeActiveAnalysisProgress(parseEventData(event as MessageEvent));
      queryClient.setQueryData(["analysis-progress", "active"], items);
    });

    source.addEventListener("progress", (event) => {
      const payload = parseEventData(event as MessageEvent);
      const itemPayload = isRecord(payload) ? payload.item : null;
      const [item] = normalizeActiveAnalysisProgress({ items: itemPayload ? [itemPayload] : [] });
      if (!item) return;

      queryClient.setQueryData<ActiveAnalysisProgress[]>(
        ["analysis-progress", "active"],
        (current = []) => {
          const withoutCurrent = current.filter(
            (candidate) => candidate.analysisJobId !== item.analysisJobId,
          );
          return isTerminal(item) ? withoutCurrent : [item, ...withoutCurrent];
        },
      );

      if (isTerminal(item)) {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ["case-analysis-status", item.caseId] }),
          queryClient.invalidateQueries({ queryKey: ["case-analysis-versions", item.caseId] }),
          queryClient.invalidateQueries({ queryKey: ["cases", "mine"] }),
        ]);
      }
    });

    return () => {
      source.close();
      setStreamStatus("closed");
    };
  }, [queryClient]);

  return null;
}
