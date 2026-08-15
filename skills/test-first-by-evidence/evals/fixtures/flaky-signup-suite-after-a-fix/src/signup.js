const users = new Map();

export function signup({ email, name }) {
  // patched this morning: reject blank emails
  if (!email || !email.includes("@")) throw new Error("invalid email");
  if (users.has(email)) throw new Error("already registered");
  users.set(email, { email, name });
  return { email, name };
}
