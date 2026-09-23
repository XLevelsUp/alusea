"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/auth/roles";

type Props = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  isSelf: boolean;
  updateRole: Action;
  setActive: Action;
};

export default function UserRow({ id, email, fullName, role, isActive, isSelf, updateRole, setActive }: Props) {
  // Controlled so a rejected change snaps back to the saved role instead of showing one that was never stored.
  const [selectedRole, setSelectedRole] = useState(role);
  const roleAction = useAction(updateRole);
  const activeAction = useAction(setActive);
  const isPending = roleAction.isPending || activeAction.isPending;
  const error = roleAction.error ?? activeAction.error;

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${isActive ? "" : "opacity-50"}`}>
      <td className="p-4 align-top">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{fullName || "—"}</span>
          <span className="text-xs text-gray-500">{email}</span>
          {isSelf && <span className="text-[10px] uppercase tracking-wider text-[#A67C52] mt-1">You</span>}
          {error && <span role="alert" className="text-xs text-destructive mt-2">{error}</span>}
        </div>
      </td>
      <td className="p-4 align-top">
        <NativeSelect
          value={selectedRole}
          disabled={isPending || isSelf}
          aria-label={`Role for ${email}`}
          className="w-44"
          onChange={(e) => {
            const next = e.target.value as Role;
            setSelectedRole(next);
            activeAction.setError(null);
            const fd = new FormData();
            fd.set("user_id", id);
            fd.set("role", next);
            roleAction.run(fd).then((result) => {
              if (!result.ok) setSelectedRole(role);
            });
          }}
        >
          {ROLES.map((r) => (
            <NativeSelectOption key={r} value={r}>
              {ROLE_LABELS[r]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </td>
      <td className="p-4 align-top">
        <span
          className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
            isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="p-4 align-top text-right">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || isSelf}
          onClick={() => {
            roleAction.setError(null);
            const fd = new FormData();
            fd.set("user_id", id);
            fd.set("is_active", String(!isActive));
            activeAction.run(fd);
          }}
        >
          {isPending ? "…" : isActive ? "Deactivate" : "Reactivate"}
        </Button>
      </td>
    </tr>
  );
}
