"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FormDialogContext = createContext<{ close: () => void } | null>(null);

type Props = {
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  size?: "md" | "lg" | "xl";
  defaultOpen?: boolean;
  children: ReactNode;
};

const SIZES = { md: "sm:max-w-md", lg: "sm:max-w-lg", xl: "sm:max-w-2xl" };

// Opens an add/edit form in place with client state, so no server round-trip happens just to show or hide it.
export function FormDialog({ trigger, title, description, size = "xl", defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-h-[90vh] gap-0 p-0 flex flex-col", SIZES[size])}>
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-lg font-bold uppercase tracking-wider text-matte-black">{title}</DialogTitle>
          {/* Radix warns when a dialog has no description, so a visually hidden one stands in when none is given. */}
          <DialogDescription className={description ? undefined : "sr-only"}>{description ?? title}</DialogDescription>
        </DialogHeader>
        {/* Radix unmounts closed content, so each opening starts the form fresh. */}
        <div className="p-6 overflow-y-auto">
          <FormDialogContext.Provider value={{ close: () => setOpen(false) }}>{children}</FormDialogContext.Provider>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// What a form does once it saves: inside a dialog it closes it and refreshes the page data in place; on its own page it goes back to cancelUrl.
export function useFormDone(cancelUrl?: string) {
  const dialog = useContext(FormDialogContext);
  const router = useRouter();

  return () => {
    if (dialog) {
      dialog.close();
      router.refresh();
    } else if (cancelUrl) {
      window.location.href = cancelUrl;
    }
  };
}

// Cancel closes the surrounding dialog, or links back to cancelUrl when the form has a page of its own.
export function CancelButton({ cancelUrl, className }: { cancelUrl?: string; className?: string }) {
  const dialog = useContext(FormDialogContext);

  if (dialog) {
    return (
      <DialogClose asChild>
        <Button type="button" variant="outline" className={className}>Cancel</Button>
      </DialogClose>
    );
  }
  if (!cancelUrl) return null;
  return (
    <Button asChild variant="outline" className={className}>
      <Link href={cancelUrl}>Cancel</Link>
    </Button>
  );
}
