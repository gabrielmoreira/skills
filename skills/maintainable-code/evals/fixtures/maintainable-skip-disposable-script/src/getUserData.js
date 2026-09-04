export function getUserData(store, id) {
  return store.users.get(id) ?? null;
}
