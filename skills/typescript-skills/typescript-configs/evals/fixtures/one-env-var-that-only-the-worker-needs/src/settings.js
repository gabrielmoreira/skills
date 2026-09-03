const required = [
  "DATABASE_URL",
  "SIGNING_KEY",
  "PARTNER_BASE_URL",
  "LABEL_PRINTER_HOST",
];

function read() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`missing configuration: ${missing.join(", ")}`);
  }
  return {
    databaseUrl: process.env.DATABASE_URL,
    signingKey: process.env.SIGNING_KEY,
    partnerBaseUrl: process.env.PARTNER_BASE_URL,
    labelPrinterHost: process.env.LABEL_PRINTER_HOST,
    requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 5000),
  };
}

export const settings = read();
