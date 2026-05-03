type SendReceiptDependencies = {
  mailer: Mailer;
};

export function makeSendReceipt({ mailer }: SendReceiptDependencies) {
  return async function sendReceipt(input: ReceiptInput) {
    return mailer.send(input);
  };
}
