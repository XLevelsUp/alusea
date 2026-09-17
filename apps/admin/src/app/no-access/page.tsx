import Link from "next/link";
import { getProfile } from "@/lib/auth/session";
import { landingPageFor, ROLE_LABELS } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function NoAccessPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const home = landingPageFor(profile.role);

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-16 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-matte-black mb-3">
          No access to this page
        </h1>
        <p className="text-gray-500 mb-2">
          Your account is signed in as <span className="font-semibold">{ROLE_LABELS[profile.role]}</span>, which does not
          include this area.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          If you need access, ask an owner to change your role in Settings.
        </p>
        {home === "/no-access" ? (
          <p className="text-sm text-gray-400">There are no modules assigned to your role yet.</p>
        ) : (
          <Link
            href={home}
            className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors"
          >
            Go to my dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
