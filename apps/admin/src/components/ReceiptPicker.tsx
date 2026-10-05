"use client";

import { useRef, useState } from "react";
import { CameraIcon, FileTextIcon, PaperclipIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RECEIPT_ACCEPT, receiptFileProblem } from "@/lib/erp/receipts";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Two ways to attach a receipt: pick an existing file, or open the camera to photograph the bill.
// The chosen file is held in state rather than in an input, because either of two inputs can supply it.
export default function ReceiptPicker({ file, onChange, disabled }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    // Reset so picking the same file again, after removing it, still fires a change.
    e.target.value = "";
    if (!picked) return;

    const issue = receiptFileProblem(picked);
    setProblem(issue);
    onChange(issue ? null : picked);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" variant="outline" disabled={disabled} onClick={() => fileInput.current?.click()}>
          <PaperclipIcon aria-hidden="true" />
          Choose file
        </Button>
        <Button type="button" size="lg" variant="outline" disabled={disabled} onClick={() => cameraInput.current?.click()}>
          <CameraIcon aria-hidden="true" />
          Take photo
        </Button>
      </div>

      <input ref={fileInput} type="file" accept={RECEIPT_ACCEPT} onChange={onPicked} className="sr-only" tabIndex={-1} aria-hidden="true" />
      {/* capture opens the rear camera on phones and tablets; a desktop browser falls back to its file picker. */}
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={onPicked} className="sr-only" tabIndex={-1} aria-hidden="true" />

      {file && (
        <p className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-gray-900">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${file.name}`}
            onClick={() => onChange(null)}
            className="ml-auto text-gray-500 hover:text-destructive"
          >
            <XIcon />
          </Button>
        </p>
      )}

      {problem && <p role="alert" className="text-sm text-destructive">{problem}</p>}
    </div>
  );
}
