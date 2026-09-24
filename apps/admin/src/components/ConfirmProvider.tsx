"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  // "danger" for anything that removes, deactivates or cannot be undone; "neutral" for a serious but constructive step like issuing.
  tone?: "danger" | "neutral";
  // When set, the person must type a reason before they can confirm, and it is returned to the caller.
  reason?: { label: string; placeholder?: string };
};

// Null means cancelled; otherwise the confirmation, carrying the typed reason when one was asked for.
export type ConfirmResult = { reason: string } | null;

type Pending = ConfirmOptions & { resolve: (result: ConfirmResult) => void };

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<ConfirmResult>) | null>(null);

// One confirmation modal for the whole admin, mounted once in the layout and opened from anywhere with useConfirm().
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const pendingRef = useRef<Pending | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    // A second request while one is open cancels the first, so no caller is left waiting forever.
    pendingRef.current?.resolve(null);
    return new Promise<ConfirmResult>((resolve) => {
      const next = { ...options, resolve };
      pendingRef.current = next;
      setReason("");
      setPending(next);
    });
  }, []);

  const settle = (result: ConfirmResult) => {
    pendingRef.current?.resolve(result);
    pendingRef.current = null;
    setPending(null);
  };

  const danger = (pending?.tone ?? "danger") === "danger";
  const needsReason = !!pending?.reason;
  const canConfirm = !needsReason || reason.trim().length > 0;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={!!pending} onOpenChange={(open) => !open && settle(null)}>
        <AlertDialogContent>
          {pending && (
            <>
              <AlertDialogHeader>
                <AlertDialogMedia className={danger ? "bg-red-50 text-destructive" : "bg-muted text-matte-black"}>
                  {danger ? <AlertTriangleIcon /> : <InfoIcon />}
                </AlertDialogMedia>
                <AlertDialogTitle className="font-bold">{pending.title}</AlertDialogTitle>
                {pending.description && <AlertDialogDescription>{pending.description}</AlertDialogDescription>}
              </AlertDialogHeader>

              {pending.reason && (
                <Field>
                  <FieldLabel htmlFor="confirm-reason">
                    {pending.reason.label}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="confirm-reason"
                    autoFocus
                    value={reason}
                    placeholder={pending.reason.placeholder}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canConfirm) settle({ reason: reason.trim() });
                    }}
                  />
                </Field>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel size="lg">{pending.cancelLabel ?? "Cancel"}</AlertDialogCancel>
                <AlertDialogAction
                  size="lg"
                  variant={danger ? "danger" : "default"}
                  disabled={!canConfirm}
                  onClick={(e) => {
                    // Radix closes on Action by itself; settling here first is what hands the answer back to the caller.
                    if (!canConfirm) {
                      e.preventDefault();
                      return;
                    }
                    settle({ reason: reason.trim() });
                  }}
                >
                  {pending.confirmLabel ?? "Confirm"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

// const confirm = useConfirm(); if (!(await confirm({ title: "Delete this?" }))) return;
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}
