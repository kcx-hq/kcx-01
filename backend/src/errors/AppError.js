export class AppError extends Error {
  constructor(status, code, safeMessage, options = {}) {
    super(safeMessage);
    this.name = "AppError";
    this.status = Number(status) || 500;
    this.code = String(code || "INTERNAL");
    this.safeMessage = String(safeMessage || "Internal server error");
    this.cause = options.cause;
  }
}

export default AppError;
