export function makeRequestServices(app: AppServices, requestId: string) {
  return {
    audit: makeAuditLogger({ requestId, base: app.audit }),
    sendReceipt: makeSendReceipt({ mailer: app.mailer }),
  };
}
