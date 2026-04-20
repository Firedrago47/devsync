const DEFAULT_WISDOM_URL = "https://wisdom-ai-fn24.onrender.com";
const ALLOWED_WISDOM_HOSTS = new Set([
  "wisdom-ai-fn24.onrender.com",
]);

export function getWisdomConfig() {
  const key = process.env.WISDOM_API_KEY;
  if (!key) {
    throw new Error("WISDOM_API_KEY is required");
  }

  const base = process.env.WISDOM_URL || DEFAULT_WISDOM_URL;
  const parsed = new URL(base);

  if (!ALLOWED_WISDOM_HOSTS.has(parsed.hostname)) {
    throw new Error("WISDOM_URL host is not allowed");
  }

  return {
    base: parsed.origin,
    key,
    reviewUrl: new URL("/review", parsed.origin).toString(),
    chatUrl: new URL("/api/wisdom/chat", parsed.origin).toString(),
    healthUrl: new URL("/health", parsed.origin).toString(),
  };
}
