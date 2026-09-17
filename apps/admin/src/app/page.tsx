import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { landingPageFor } from "@/lib/auth/roles";

export default async function AdminRootPage() {
  const profile = await getProfile();

  redirect(profile ? landingPageFor(profile.role) : "/login");
}
