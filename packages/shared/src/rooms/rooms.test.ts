import { describe, expect, it } from 'vitest';
import { joinCodeSchema } from './rooms.ts';

describe('joinCodeSchema', () => {
  it('normalizes case and whitespace', () => {
    expect(joinCodeSchema.parse(' abc234 ')).toBe('ABC234');
  });

  it.each(['ABC23', 'ABC2345', 'ABC20O', 'ABC21I', 'ABCL23', 'ABC-23'])('rejects %s', (code) => {
    expect(joinCodeSchema.safeParse(code).success).toBe(false);
  });
});
