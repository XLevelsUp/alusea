"use client";

import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  tone?: "neutral" | "danger";
  confirmLabel: ReactNode;
  pendingLabel?: ReactNode;
  cancelLabel?: ReactNode;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // When set, the confirm button stays disabled until a reason is typed.
  reason?: { value: string; onChange: (value: string) => void; placeholder: string; label: string };
};

// The inline "are you sure" step shown under an action bar before an irreversible action runs.
export default function ConfirmPanel({
  title,
  description,
  tone = "danger",
  confirmLabel,
  pendingLabel = "Working…",
  cancelLabel = "Keep it",
  isPending,
  onConfirm,
  onCancel,
  reason,
}: Props) {
  const danger = tone === "danger";

  return (
    <Alert className={cn("mt-4 p-4 gap-3", danger ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50")}>
      <div>
        <AlertTitle className={cn("font-semibold", danger ? "text-red-900" : "text-gray-900")}>{title}</AlertTitle>
        {description && (
          <AlertDescription className={cn("text-xs mt-1", danger ? "text-red-800" : "text-gray-600")}>{description}</AlertDescription>
        )}
      </div>
      {reason && (
        <Input
          value={reason.value}
          onChange={(e) => reason.onChange(e.target.value)}
          placeholder={reason.placeholder}
          aria-label={reason.label}
          className="bg-white border-red-200"
        />
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="lg"
          variant={danger ? "danger" : "default"}
          disabled={isPending || (!!reason && !reason.value.trim())}
          onClick={onConfirm}
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Alert>
  );
}
