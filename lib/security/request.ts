const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function parseHost(value: string | null) {
  if (!value) return null;
  try {
    return normalizeHost(new URL(value).host);
  } catch {
    return null;
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function isTrustedOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    // Non-browser calls can omit Origin.
    return true;
  }

  const originHost = parseHost(originHeader);
  if (!originHost) return false;

  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  const acceptedHosts = new Set<string>();
  if (hostHeader) acceptedHosts.add(normalizeHost(hostHeader));

  const appHost = parseHost(process.env.NEXT_PUBLIC_APP_URL ?? null);
  if (appHost) acceptedHosts.add(appHost);

  const nextAuthHost = parseHost(process.env.NEXTAUTH_URL ?? null);
  if (nextAuthHost) acceptedHosts.add(nextAuthHost);

  return acceptedHosts.has(originHost);
}
