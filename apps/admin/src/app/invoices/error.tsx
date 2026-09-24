"use client";

import ErrorState from "@/components/ErrorState";

export default function RouteError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState {...props} section="invoices" backHref="/invoices" />;
}
