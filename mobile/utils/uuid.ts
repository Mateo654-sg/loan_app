/**
 * UUID v4 generator with Expo/RN compatibility:
 * uses crypto.randomUUID when available, otherwise a validated
 * crypto.getRandomValues fallback (no Math.random for identifiers).
 */
export function randomUUID(): string {
  const cryptoRef = globalThis.crypto as Crypto | undefined;

  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }

  if (cryptoRef?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoRef.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  throw new Error('No secure random source available for idempotency keys');
}
