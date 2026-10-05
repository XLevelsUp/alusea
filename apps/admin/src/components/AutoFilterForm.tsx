"use client";

import { useEffect, useRef, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

// A filter bar that applies itself: any change to a field inside it updates the list straight away, with no Apply button.
// The fields stay ordinary named inputs, so the page still reads its filters from the address as before.
export default function AutoFilterForm({ action, className, children }: { action: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const apply = () => {
      const query = new URLSearchParams();
      for (const [key, value] of new FormData(form)) {
        if (typeof value === "string" && value !== "") query.set(key, value);
      }
      // Replace rather than push, so filtering does not pile up steps behind the Back button.
      startTransition(() => router.replace(`${action}?${query}`, { scroll: false }));
    };

    // Typing waits for a pause before searching; picking from a dropdown or a date applies at once.
    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.tagName !== "INPUT" || !["search", "text"].includes(target.type)) return;
      clearTimeout(timer);
      timer = setTimeout(apply, 350);
    };
    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.tagName === "INPUT" && ["search", "text"].includes(target.type)) return;
      clearTimeout(timer);
      apply();
    };
    const onSubmit = (event: Event) => {
      event.preventDefault();
      clearTimeout(timer);
      apply();
    };

    // Native listeners, because a value set by script (the searchable dropdown's hidden field) never reaches React's onChange.
    form.addEventListener("input", onInput);
    form.addEventListener("change", onChange);
    form.addEventListener("submit", onSubmit);
    return () => {
      clearTimeout(timer);
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onChange);
      form.removeEventListener("submit", onSubmit);
    };
  }, [action, router]);

  return (
    <form ref={formRef} action={action} className={className} aria-busy={isPending}>
      {children}
      <p className={`flex items-center gap-1.5 text-xs text-muted-foreground mt-3 ${isPending ? "" : "invisible"}`} aria-live="polite">
        <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
        Updating…
      </p>
    </form>
  );
}
