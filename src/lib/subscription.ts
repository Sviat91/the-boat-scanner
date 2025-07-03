export const hasActiveSubscription = (
  subscribedUntil?: string | Date | null,
): boolean => {
  if (!subscribedUntil) return false
  const expiry = subscribedUntil instanceof Date ? subscribedUntil : new Date(subscribedUntil)
  return expiry > new Date()
}
