import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/cn";
import { ToastContext, type ToastMessage } from "./toast-context";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const showToast = useCallback(
    (message: Omit<ToastMessage, "id">) => {
      const id = Date.now();
      setMessages((current) => [...current, { ...message, id }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3" aria-live="polite" aria-atomic="true">
        {messages.map((message) => {
          const Icon = message.tone === "success" ? CheckCircle2 : XCircle;
          return (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border bg-white p-4 text-sm text-ink-950 shadow-lg",
                message.tone === "error" && "border-2 border-ink-950",
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 font-medium">{message.title}</p>
              <Button variant="ghost" className="min-h-0 p-1" aria-label="Dismiss notification" onClick={() => dismiss(message.id)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
