"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions";

function isRedirect(error: unknown): boolean {
  return !!error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}

// Runs defineAction server actions, tracking pending state and the error to show; use this form when one component calls several actions.
export function useActionRunner() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run<Args extends unknown[], T>(
    action: (...args: Args) => Promise<ActionResult<T>>,
    ...args: Args
  ): Promise<ActionResult<T>> {
    setError(null);
    return new Promise((resolve) => {
      startTransition(async () => {
        let result: ActionResult<T> | undefined;
        try {
          result = await action(...args);
        } catch (e) {
          // A redirect() from the action surfaces here as a thrown signal; rethrowing lets Next navigate.
          if (isRedirect(e)) throw e;
          result = { ok: false, error: "Could not reach the server. Check your connection and try again." };
        }
        // No result means the action redirected and navigation is under way, so the caller has nothing to handle.
        if (!result) return;
        if (!result.ok) setError(result.error);
        resolve(result);
      });
    });
  }

  return { run, isPending, error, setError };
}

// The single-action form: bind the action once and call run with just its arguments.
export function useAction<Args extends unknown[], T>(action: (...args: Args) => Promise<ActionResult<T>>) {
  const runner = useActionRunner();
  return { ...runner, run: (...args: Args) => runner.run(action, ...args) };
}
