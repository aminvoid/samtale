/** Removes a secret from any text before it can reach a log. */
export function redact(message: string, secret: string): string {
  return secret ? message.split(secret).join("[redacted]") : message;
}
