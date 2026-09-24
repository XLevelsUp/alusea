"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, RotateCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  // Names the part of the admin that failed, e.g. "invoices", and where its list lives.
  section?: string;
  backHref?: string;
};

// The one error view every route segment shows, so a failure stays inside the page that caused it and the sidebar keeps working.
export default function ErrorState({ error, reset, section, backHref = "/" }: Props) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // A server-rendered page needs fresh data, not just a re-render of the client tree, so retry refreshes before resetting.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <Card role="alert">
        <CardHeader>
          <AlertTriangleIcon className="size-8 text-destructive mb-2" aria-hidden="true" />
          <CardTitle className="text-xl font-bold uppercase tracking-tight text-matte-black">
            {section ? `Could not load ${section}` : "Something went wrong"}
          </CardTitle>
          <CardDescription>
            This page hit a problem, but the rest of the admin is still working. Try again, or come back to it in a moment.
          </CardDescription>
        </CardHeader>
        {error.digest && (
          <CardContent>
            <p className="text-xs text-muted-foreground">
              If it keeps happening, send this reference to whoever looks after the admin:{" "}
              <code className="font-mono text-foreground select-all">{error.digest}</code>
            </p>
          </CardContent>
        )}
        <CardFooter className="gap-3 bg-transparent border-t-0 pt-0">
          <Button type="button" onClick={retry} disabled={isRetrying}>
            <RotateCwIcon className={isRetrying ? "animate-spin" : undefined} aria-hidden="true" />
            {isRetrying ? "Retrying…" : "Try again"}
          </Button>
          <Button asChild variant="outline">
            <Link href={backHref}>{backHref === "/" ? "Go to home" : `Back to ${section ?? "list"}`}</Link>
          </Button>
          {/* When the section's own list is what failed, going back to it would loop, so home is always one click away. */}
          {backHref !== "/" && (
            <Button asChild variant="ghost">
              <Link href="/">Home</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
