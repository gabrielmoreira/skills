it('parses a valid config slice', () => {
  expect(getNotificationsConfig({
    NOTIFICATIONS_ENABLED: 'true',
    NOTIFICATIONS_QUEUE_URL: 'queue-1',
  })).toEqual({
    mode: 'sqs',
    queueUrl: 'queue-1',
  });
});
