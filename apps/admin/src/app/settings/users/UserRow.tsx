"use client";

import { useState, useTransition } from "react";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/auth/roles";

type Props = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  isSelf: boolean;
  updateRole: (formData: FormData) => Promise<void>;
  setActive: (formData: FormData) => Promise<void>;
};

export default function UserRow({ id, email, fullName, role, isActive, isSelf, updateRole, setActive }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: (fd: FormData) => Promise<void>, formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${isActive ? "" : "opacity-50"}`}>
      <td className="p-4 align-top">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{fullName || "—"}</span>
          <span className="text-xs text-gray-500">{email}</span>
          {isSelf && <span className="text-[10px] uppercase tracking-wider text-[#A67C52] mt-1">You</span>}
          {error && <span className="text-xs text-red-600 mt-2">{error}</span>}
        </div>
      </td>
      <td className="p-4 align-top">
        <select
          defaultValue={role}
          disabled={isPending || isSelf}
          aria-label={`Role for ${email}`}
          onChange={(e) => {
            const fd = new FormData();
            fd.set("user_id", id);
            fd.set("role", e.target.value);
            run(updateRole, fd);
          }}
          className="rounded-md px-3 py-2 bg-white border border-gray-200 text-sm text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
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
        <button
          type="button"
          disabled={isPending || isSelf}
          onClick={() => {
            const fd = new FormData();
            fd.set("user_id", id);
            fd.set("is_active", String(!isActive));
            run(setActive, fd);
          }}
          className="text-xs font-semibold uppercase tracking-wider px-3 py-1 border rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          {isPending ? "…" : isActive ? "Deactivate" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}
