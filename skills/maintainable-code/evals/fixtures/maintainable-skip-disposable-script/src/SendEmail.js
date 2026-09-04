export function sendEmail(transport, to, body) {
  return transport.send({ to, body });
}
