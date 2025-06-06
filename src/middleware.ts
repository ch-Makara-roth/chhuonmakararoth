
import { NextResponse, type NextRequest } from 'next/server';
import { languages, defaultLocale as DEFAULT_LOCALE } from './app/i18n/settings';

const PUBLIC_FILE = /\.(.*)$/; // Matches files with extensions like .svg, .png, .js, .css etc.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js specific paths, API routes (except auth), admin routes, login page, and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/') || // Explicitly allow NextAuth.js API routes
    pathname.startsWith('/admin') ||     // Exclude all admin routes from locale processing
    pathname.startsWith('/login') ||     // Exclude login page from locale processing
    PUBLIC_FILE.test(pathname)
  ) {
    // For /api/ routes other than /api/auth/, you might want to decide if they need i18n or not.
    // For now, assuming other /api/ routes (like /api/projects) don't need i18n rewrites.
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
    }
    return NextResponse.next();
  }

  const pathnameIsMissingLocale = languages.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Handle requests for the default locale prefix
  if (pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    // Redirect /en/path -> /path
    const newPath = pathname.substring(`/${DEFAULT_LOCALE}`.length);
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = newPath.startsWith('/') ? newPath : `/${newPath}`;
    if (targetUrl.pathname === '') targetUrl.pathname = '/'; // Ensure root is /
    return NextResponse.redirect(targetUrl);
  }
  if (pathname === `/${DEFAULT_LOCALE}`) {
    // Redirect /en -> /
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = '/';
    return NextResponse.redirect(targetUrl);
  }

  // If pathname is missing a locale and it's not the root for a non-default locale
  if (pathnameIsMissingLocale) {
    // Rewrite to default locale: /path -> /en/path (internal)
    // This means the user sees /path, but Next.js serves content from /en/path
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`; // Handle root path correctly
    return NextResponse.rewrite(url);
  }

  // For other locales like /km/path or /km, do nothing. They are handled by app/[lang]
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for specific Next.js internals and assets
    '/((?!_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};
