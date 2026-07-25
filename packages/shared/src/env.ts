/** Trim env vars (Vercel/Windows sometimes adds \\r\\n). */
export function env(name: string): string | undefined {
  const value = process.env[name];
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
