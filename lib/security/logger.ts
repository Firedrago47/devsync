type LogLevel = "info" | "warn" | "error";

interface SecurityLogPayload {
  event: string;
  userId?: string;
  ip?: string;
  path?: string;
  details?: Record<string, unknown>;
}

export function logSecurity(
  level: LogLevel,
  payload: SecurityLogPayload
) {
  const entry = {
    level,
    ts: new Date().toISOString(),
    ...payload,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}
