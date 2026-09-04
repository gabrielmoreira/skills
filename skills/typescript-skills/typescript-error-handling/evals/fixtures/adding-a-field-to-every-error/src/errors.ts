export type Severity = "info" | "warning" | "critical";

export interface AppErrorOptions {
  code: string;
  severity: Severity;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly severity: Severity;

  constructor(message: string, options: AppErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code;
    this.severity = options.severity;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, { code: "VALIDATION_FAILED", severity: "warning" });
    this.name = "ValidationError";
  }
}

export class UpstreamTimeoutError extends AppError {
  constructor(url: string, cause?: unknown) {
    super("upstream did not answer in time: " + url, { code: "UPSTREAM_TIMEOUT", severity: "critical", cause });
    this.name = "UpstreamTimeoutError";
  }
}
