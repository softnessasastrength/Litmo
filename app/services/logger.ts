const blockedKeys =
  /consent|body.?zone|nervous|note|password|token|secret|session/i;
const sensitiveValue =
  /private|consent|withdraw|safety|passkey|bearer|token|secret|body.?zone/i;
function sanitize(key: string, value: unknown): unknown {
  if (blockedKeys.test(key)) return "[REDACTED]";
  if (typeof value === "string" && sensitiveValue.test(value))
    return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => sanitize("item", item));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, item]) => [
        nestedKey,
        sanitize(nestedKey, item),
      ]),
    );
  return value;
}
export function safeLog(event: string, metadata: Record<string, unknown> = {}) {
  const redacted = Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, sanitize(key, value)]),
  );
  if (__DEV__) console.info(`[litmo] ${event}`, redacted);
}

export function privacySafeMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, sanitize(key, value)]),
  );
}
