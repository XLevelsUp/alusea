"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import { inviteUser, type InviteResult } from "./actions";

const initialState: InviteResult = { error: null };

export default function AddUserForm() {
  const [state, formAction, isPending] = useActionState(inviteUser, initialState);

  // Keyed on the returned state so a failed submit remounts the fields with the values that were sent.
  return (
    <form key={JSON.stringify(state)} action={formAction} className="p-6 space-y-4 overflow-y-auto">
      {state.error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={state.values?.full_name}
          type="text"
          required
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          defaultValue={state.values?.email}
          type="email"
          required
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
          Temporary password
        </label>
        <input
          id="password"
          name="password"
          defaultValue={state.values?.password}
          type="text"
          required
          minLength={8}
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
        />
        <p className="text-xs text-gray-400 mt-1">Share this with them directly, then ask them to change it after signing in.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue={state.values?.role || "staff"}
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-matte-black hover:bg-black text-white px-4 py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {isPending ? "Creating…" : "Create User"}
        </button>
        <Link
          href="/settings/users"
          className="px-5 py-3 border border-gray-200 text-gray-600 rounded-md uppercase tracking-widest text-xs font-bold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
