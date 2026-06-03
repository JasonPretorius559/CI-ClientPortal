import { createContext, useContext } from "react";

export type ToastTone = "success" | "error";
export type ToastMessage = {
  id: number;
  title: string;
  tone: ToastTone;
};

export type ToastContextValue = {
  showToast: (message: Omit<ToastMessage, "id">) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider.");
  return context;
}
