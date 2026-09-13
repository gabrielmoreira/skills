// Pre-existing logger. Entries are shipped to the shared log platform and
// retained for 400 days by the platform's own policy.
export const log = {
  info(message, fields) { process.stdout.write(JSON.stringify({ message, ...fields }) + "\n"); },
};
