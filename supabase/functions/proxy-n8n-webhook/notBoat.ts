const DEFAULT_NOT_BOAT =
  "Oops! 🚫 The uploaded image doesn't seem to show a watercraft. Please upload a yacht, boat, or other water vessel to continue.";

export function isNotBoat(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  if (obj.not_boat === true || typeof obj.not_boat === 'string') return true;
  if (Array.isArray(value)) return value.some(isNotBoat);
  return Object.values(obj).some(isNotBoat);
}

export function pickNotBoatMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (obj.not_boat === true) {
    const msg = obj.not_boat_user_message;
    return typeof msg === 'string' && msg ? msg : DEFAULT_NOT_BOAT;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const r = pickNotBoatMessage(item);
      if (r) return r;
    }
    return null;
  }
  for (const val of Object.values(obj)) {
    const r = pickNotBoatMessage(val);
    if (r) return r;
  }
  if (typeof obj.not_boat === 'string') return obj.not_boat;
  return null;
}

export function normalizeNotBoat(payload: any): any {
  const nbMsg = pickNotBoatMessage(payload);
  if (!nbMsg) return payload;
  const first = Array.isArray(payload?.body) ? payload.body[0] ?? {} : {};
  const nbObj = { ...first, not_boat: nbMsg };
  return {
    ...payload,
    not_boat: nbMsg,
    body: [nbObj],
  };
}

export { DEFAULT_NOT_BOAT };
