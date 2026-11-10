/** Reject malformed JS configuration instead of silently ignoring a policy. */
export const checkOptions = (options: readonly { kind: string }[], allowed: readonly string[]): void => {
  const seen = new Set<string>();
  for (const option of options) {
    if (!option || !allowed.includes(option.kind)) throw new TypeError(`Unsupported policy: ${option?.kind}`);
    if (seen.has(option.kind)) throw new TypeError(`Duplicate policy: ${option.kind}`);
    seen.add(option.kind);
  }
};
export const unreachable = (value: never): never => {
  throw new TypeError(`Unsupported control: ${JSON.stringify(value)}`);
};
