let cached;

export function rateClient(deps, account) {
  if (!cached) {
    cached = deps.build({
      baseUrl: account.rateEndpoint,
      credentials: account.credentials,
      marginBps: account.marginBps,
    });
  }
  return cached;
}
