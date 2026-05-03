export function bootstrap(env: Record<string, unknown>) {
  const config = getAppConfig(env);
  const mailer = config.useFakeMailer ? makeFakeMailer() : makeSesMailer();

  return {
    sendReceipt: makeSendReceipt({ mailer }),
  };
}
