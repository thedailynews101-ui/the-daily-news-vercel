class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  /**
   * Machine-readable identifier a client can branch on without parsing the
   * human-readable `message` (which may be reworded later). Optional -
   * most errors only need the message.
   */
  public readonly errorCode?: string;

  constructor(statusCode: number, message: string, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
