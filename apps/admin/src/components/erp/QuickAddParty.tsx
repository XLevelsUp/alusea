"use client";

import { PlusIcon } from "lucide-react";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import PartyForm from "@/app/parties/PartyForm";
import { addParty, updateParty } from "@/app/parties/actions";
import type { AddedParty } from "@/lib/erp/parties";

// Adds a client or vendor from inside another form, so nobody has to leave a half-filled invoice or expense to create one.
export default function QuickAddParty({ kind, onAdded }: { kind: "client" | "vendor"; onAdded: (party: AddedParty) => void }) {
  return (
    <FormDialog
      title={kind === "client" ? "Add a new client" : "Add a new vendor"}
      description="Only the name is required. The rest can be filled in later from Clients & Vendors."
      trigger={
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 mt-2 normal-case tracking-normal text-xs font-semibold text-[#A67C52] hover:text-matte-black hover:no-underline"
        >
          <PlusIcon aria-hidden="true" className="size-3.5" />
          {kind === "client" ? "New client" : "New vendor"}
        </Button>
      }
    >
      <PartyForm add={addParty} update={updateParty} defaultKind={kind} onAdded={onAdded} />
    </FormDialog>
  );
}
