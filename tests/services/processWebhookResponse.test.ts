import { processWebhookResponse } from '@/services/searchService';

describe('processWebhookResponse', () => {
  const DEFAULT_MSG =
    "Oops! 🚫 The uploaded image doesn't seem to show a watercraft. Please upload a yacht, boat, or other water vessel to continue.";

  test('top-level not_boat boolean with message', () => {
    const payload = {
      not_boat: true,
      not_boat_user_message: 'Custom NB message',
    };
    const res = processWebhookResponse(payload);
    expect(res.not_boat).toBe('Custom NB message');
  });

  test('body[0] not_boat boolean with message', () => {
    const payload = {
      body: [
        {
          not_boat: true,
          not_boat_user_message: 'NB from body',
        },
      ],
    };
    const res = processWebhookResponse(payload);
    expect(res.not_boat).toBe('NB from body');
  });

  test('legacy top-level not_boat string', () => {
    const payload = { not_boat: 'Legacy string' };
    const res = processWebhookResponse(payload);
    expect(res.not_boat).toBe('Legacy string');
  });

  test('legacy array not_boat string', () => {
    const payload = [{ not_boat: 'Legacy array string' }];
    const res = processWebhookResponse(payload);
    expect(res.not_boat).toBe('Legacy array string');
  });

  test('fallback default message when boolean without message', () => {
    const payload = { not_boat: true } as any;
    const res = processWebhookResponse(payload);
    expect(res.not_boat).toBe(DEFAULT_MSG);
  });

  test('success array returns results', () => {
    const payload = [
      { url: 'http://example.com/1', user_short_description: 'desc1' },
      { url: 'http://example.com/2', user_short_description: 'desc2' },
    ];
    const res = processWebhookResponse(payload);
    expect(res.results).toHaveLength(2);
  });

  test('success object with body returns results', () => {
    const payload = {
      body: [{ url: 'http://example.com/1', user_short_description: 'desc1' }],
    };
    const res = processWebhookResponse(payload);
    expect(res.results).toHaveLength(1);
  });
});

