const DEFAULT_APP_URL = "http://localhost:3000";

function toHttpUrlCandidate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Host-only values like "10.10.2.248:3000" are common in local setups.
  if (/^[A-Za-z0-9.-]+(?::\d+)?$/.test(trimmed)) {
    return `http://${trimmed}`;
  }

  return trimmed;
}

export function getSafeAppBaseUrl() {
  const rawCandidates = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    DEFAULT_APP_URL
  ];

  const candidates = rawCandidates.flatMap((value) =>
    (value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  );

  for (const candidate of candidates) {
    const urlCandidate = toHttpUrlCandidate(candidate || "");

    if (!urlCandidate) {
      continue;
    }

    try {
      const parsed = new URL(urlCandidate);
      return parsed.origin;
    } catch {
      continue;
    }
  }

  return DEFAULT_APP_URL;
}

export function getSafeRequestUrl(request: Request, fallbackPath: string) {
  const baseUrl = getSafeAppBaseUrl();
  const requestUrl = typeof request.url === "string" ? request.url.trim() : "";

  if (requestUrl) {
    try {
      return new URL(requestUrl, baseUrl);
    } catch {
      // Fallback below.
    }
  }

  return new URL(fallbackPath, baseUrl);
}
