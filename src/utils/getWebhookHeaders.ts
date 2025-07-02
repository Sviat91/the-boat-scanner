export const getWebhookHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'x-secret-token': token
});

