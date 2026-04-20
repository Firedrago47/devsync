type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(input: {
  key: string;
  max: number;
  windowMs: number;
}) {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(input.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return {
      ok: true,
      remaining: input.max - 1,
      resetAt: now + input.windowMs,
    };
  }

  existing.count += 1;
  buckets.set(input.key, existing);

  return {
    ok: existing.count <= input.max,
    remaining: Math.max(0, input.max - existing.count),
    resetAt: existing.resetAt,
  };
}
