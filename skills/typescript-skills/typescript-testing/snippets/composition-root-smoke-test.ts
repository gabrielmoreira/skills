it('boots the app and exposes sendReceipt', () => {
  const app = bootstrap({ USE_FAKE_MAILER: 'true' });
  expect(app.sendReceipt).toBeDefined();
});
