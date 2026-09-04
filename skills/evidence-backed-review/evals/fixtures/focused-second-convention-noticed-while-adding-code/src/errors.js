export class AppError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}
