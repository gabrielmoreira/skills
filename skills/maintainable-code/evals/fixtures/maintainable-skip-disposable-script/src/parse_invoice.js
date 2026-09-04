export function parseInvoice(line) {
  const [id, cents] = line.split(",");
  return { id, cents: Number(cents) };
}
