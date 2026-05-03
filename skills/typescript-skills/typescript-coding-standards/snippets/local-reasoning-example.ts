export async function sendReceipt(input: ReceiptInput) {
  const receipt = buildReceipt(input);
  await mailer.send(receipt);
  return receipt.id;
}
