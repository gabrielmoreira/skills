it('keeps current fallback behavior', () => {
  const env = { ...process.env, PORT: '' };
  expect(readLegacyConfig(env).port).toBe('3000');
});
