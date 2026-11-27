import { NextResponse, type NextRequest } from "next/server";

// The Google Ads landing page lives at /ad; on its own subdomain it is the only page a visitor can reach.
const AD_HOST = "ad.alusea.in";
const AD_PATH = "/ad";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host !== AD_HOST) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Search engines are asked to skip the whole subdomain, so it never competes with www.alusea.in.
  if (pathname === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
  }

  // The landing page is served at the bare address: ad.alusea.in shows /ad.
  if (pathname === "/") {
    const response = NextResponse.rewrite(new URL(AD_PATH, request.url));
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // Any other address on the subdomain goes back to the landing page.
  return NextResponse.redirect(new URL("/", request.url));
}

// Static files, images and Next.js internals pass straight through, so the page's assets still load on the subdomain.
export const config = {
  matcher: ["/((?!_next/|api/|images/|videos/|brochure/|tour/|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|webm|mp4|woff2?|pdf|txt|xml)$).*)", "/robots.txt"],
};
