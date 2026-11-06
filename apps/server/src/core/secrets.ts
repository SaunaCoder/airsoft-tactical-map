import { createHash } from 'node:crypto';

// Unsalted SHA-256 is enough for our secrets (leader tokens, template owner keys): they are long
// CSPRNG output, not guessable passwords. Only the hash is ever stored.
export function sha256Hex(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}
