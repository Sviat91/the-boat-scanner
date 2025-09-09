import { normalizeNotBoat, isNotBoat, DEFAULT_NOT_BOAT } from '../../supabase/functions/proxy-n8n-webhook/notBoat';

describe('normalizeNotBoat', () => {
  it('converts boolean flag with message to string', () => {
    const payload = {
      not_boat: true,
      not_boat_user_message: 'No boat',
      body: [{ not_boat: true, not_boat_user_message: 'No boat' }],
    };
    const result = normalizeNotBoat(payload);
    expect(result.not_boat).toBe('No boat');
    expect(result.body[0].not_boat).toBe('No boat');
    expect(isNotBoat(result)).toBe(true);
  });

  it('handles legacy string format', () => {
    const payload = { not_boat: 'Legacy' };
    const result = normalizeNotBoat(payload);
    expect(result.not_boat).toBe('Legacy');
    expect(isNotBoat(result)).toBe(true);
  });

  it('ignores payload without not_boat', () => {
    const payload = { results: [] };
    const result = normalizeNotBoat(payload);
    expect(result).toEqual(payload);
    expect(isNotBoat(result)).toBe(false);
  });

  it('falls back to default message when missing', () => {
    const payload = { not_boat: true };
    const result = normalizeNotBoat(payload);
    expect(result.not_boat).toBe(DEFAULT_NOT_BOAT);
    expect(isNotBoat(result)).toBe(true);
  });
});
