import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Skip in local development — no SSL, no www needed
  if (host === 'localhost' || host.startsWith('localhost:') || host.startsWith('127.0.0.1')) {
    return NextResponse.next();
  }

  // Force www — consolidate alusea.in → www.alusea.in
  // Vercel handles HTTP→HTTPS automatically at the edge, so no proto check needed here.
  if (host === 'alusea.in') {
    const url = request.nextUrl.clone();
    url.hostname = 'www.alusea.in';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Excludes Next.js internals and static asset paths.
  // sitemap.xml and robots.txt are intentionally NOT excluded so they
  // remain redirect-eligible when accessed via non-www.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
