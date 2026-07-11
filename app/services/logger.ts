const blockedKeys =
  /consent|body.?zone|nervous|note|password|token|secret|session/i;
export function safeLog(event: string, metadata: Record<string, unknown> = {}) {
  const redacted = Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      blockedKeys.test(key) ? "[REDACTED]" : value,
    ]),
  );
  if (__DEV__) console.info(`[litmo] ${event}`, redacted);
}
