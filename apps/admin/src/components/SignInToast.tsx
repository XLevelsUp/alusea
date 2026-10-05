"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { SIGNED_IN_COOKIE } from "@/lib/auth/flash";

// Shown once on the first page after signing in. The login action leaves a short-lived cookie, and this clears it so a refresh stays quiet.
export default function SignInToast({ name }: { name: string }) {
  useEffect(() => {
    // The fixed id stops a second toast when React runs the effect twice in development.
    toast.success(`Signed in as ${name}`, { id: "signed-in" });
    document.cookie = `${SIGNED_IN_COOKIE}=; Max-Age=0; path=/`;
  }, [name]);

  return null;
}
