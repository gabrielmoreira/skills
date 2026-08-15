const users = new Map();

export function handleSignup(body) {
  const email = body.email;
  const name = String(body.name ?? "").trim();
  if (users.has(email)) throw new Error("already registered");
  users.set(email, { email, name, createdAt: Date.now() });
  return { status: 201, user: { email, name } };
}
