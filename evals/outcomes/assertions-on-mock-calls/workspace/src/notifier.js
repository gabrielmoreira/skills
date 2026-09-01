export function notifyLateShipment(order, mailer, clock) {
  const days = Math.floor((clock.now() - order.shippedAt) / 86400000);
  if (days < 3) return { sent: false, days };
  mailer.send({ to: order.email, subject: "Your order is late", body: `It has been ${days} days.` });
  return { sent: true, days };
}
