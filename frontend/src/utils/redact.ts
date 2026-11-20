const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\b(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, "$1[REDACTED]"],
  [/\b(Basic\s+)[A-Za-z0-9+/=]{8,}/gi, "$1[REDACTED]"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_JWT]"],
  [/\b(sk-[A-Za-z0-9_-]{16,}|gsk_[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z\-_]{25,}|AKIA[0-9A-Z]{16})\b/g, "[REDACTED_KEY]"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/((?:password|passwd|pwd|api_key|apikey|token|secret)\s*[:=]\s*["']?)([^\s"'&;]{4,})/gi, "$1[REDACTED]"],
];

/** Mask credential-like values in log and evidence output when redaction is enabled. */
export function redactSecrets(input: string, enabled: boolean): string {
  if (!enabled || !input) return input;
  let out = input;
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
