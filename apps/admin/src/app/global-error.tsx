"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import "./globals.css";

// Shown only when the root layout itself fails (for example the profile lookup), so it renders its own html and body.
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card role="alert" className="w-full max-w-md">
            <CardHeader>
              <AlertTriangleIcon className="size-8 text-destructive mb-2" aria-hidden="true" />
              <CardTitle className="text-xl font-bold uppercase tracking-tight text-matte-black">
                The admin could not start
              </CardTitle>
              <CardDescription>
                Something went wrong before the page could load. Reloading usually fixes it; if not, sign in again.
              </CardDescription>
            </CardHeader>
            {error.digest && (
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Reference: <code className="font-mono text-foreground select-all">{error.digest}</code>
                </p>
              </CardContent>
            )}
            {/* A full reload, because the layout that failed is what a soft retry would re-render. */}
            <CardFooter className="gap-3 bg-transparent border-t-0 pt-0">
              <Button type="button" onClick={() => window.location.reload()}>
                Reload
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign in again</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
}
