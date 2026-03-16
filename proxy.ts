import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { hasClerkKeys } from "@/lib/clerk-config";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

function normalizeOrigin(origin: string) {
  const trimmed = origin.trim();

  if (!trimmed || trimmed.toLowerCase() === "null") {
    return "";
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    if (/^[A-Za-z0-9.-]+(?::\d+)?$/.test(trimmed)) {
      try {
        return new URL(`http://${trimmed}`).origin;
      } catch {
        return "";
      }
    }

    return "";
  }
}

function getFallbackOrigin(headers: Headers) {
  const host =
    firstHeaderValue(headers.get("x-forwarded-host")) ||
    firstHeaderValue(headers.get("host"));

  if (!host) {
    return "";
  }

  const proto = firstHeaderValue(headers.get("x-forwarded-proto"));
  const protocol = proto === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}

function continueWithSafeHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  const normalizedOrigin = normalizeOrigin(headers.get("origin") || "");

  if (normalizedOrigin) {
    headers.set("origin", normalizedOrigin);
  } else {
    const fallbackOrigin = getFallbackOrigin(headers);
    if (fallbackOrigin) {
      headers.set("origin", fallbackOrigin);
    } else {
      headers.delete("origin");
    }
  }

  return NextResponse.next({
    request: {
      headers
    }
  });
}

const clerkHandler = clerkMiddleware((_, request) =>
  continueWithSafeHeaders(request)
);

function redirectUnsupportedHost(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();

  // `0.0.0.0` is a bind address, not a browser-facing host.
  if (host !== "0.0.0.0") {
    return null;
  }

  const target = request.nextUrl.clone();
  target.hostname = "localhost";
  return NextResponse.redirect(target);
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const hostRedirect = redirectUnsupportedHost(request);
  if (hostRedirect) {
    return hostRedirect;
  }

  if (request.nextUrl.pathname.startsWith("/_next/static")) {
    return NextResponse.next();
  }

  if (hasClerkKeys) {
    return clerkHandler(request, event);
  }

  return continueWithSafeHeaders(request);
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/image|favicon.ico).*)",
    "/_next/static/:path*",
    "/(api|trpc)(.*)"
  ]
};
