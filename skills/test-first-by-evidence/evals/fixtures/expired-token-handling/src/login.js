function decode(token) {
  const [, payload] = token.split(".");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

export function login(token) {
  const claims = decode(token);
  return { userId: claims.sub, scopes: claims.scopes ?? [] };
}
