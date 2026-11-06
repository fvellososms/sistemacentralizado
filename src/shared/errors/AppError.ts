export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public retryAfterSeconds?: number; // sent as the Retry-After header

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code?: string): AppError {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = "Não autorizado", code?: string): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message = "Acesso negado", code?: string): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message = "Recurso não encontrado", code?: string): AppError {
    return new AppError(message, 404, code);
  }

  static tooManyRequests(message: string, retryAfterSeconds: number): AppError {
    const error = new AppError(message, 429, "RATE_LIMITED");
    error.retryAfterSeconds = retryAfterSeconds;
    return error;
  }

  static internal(message = "Erro interno do servidor", code?: string): AppError {
    return new AppError(message, 500, code);
  }

  static serviceUnavailable(message = "Serviço indisponível", code?: string): AppError {
    return new AppError(message, 503, code);
  }
}

