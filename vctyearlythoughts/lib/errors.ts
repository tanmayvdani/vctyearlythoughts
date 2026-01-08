export class AppError extends Error {
  code: string
  httpStatus: number

  constructor(message: string, code = "APP_ERROR", httpStatus = 500) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.httpStatus = httpStatus
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, "AUTH_ERROR", 401)
    this.name = "AuthError"
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded") {
    super(message, "RATE_LIMIT_EXCEEDED", 429)
    this.name = "RateLimitError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400)
    this.name = "ValidationError"
  }
}

export function mapErrorToResponse(err: unknown) {
  if (err instanceof AppError) {
    return { error: err.message, code: err.code }
  }
  if (err instanceof Error) {
    console.error(err)
    return { error: "Internal error", code: "INTERNAL_ERROR" }
  }
  return { error: "Internal error", code: "INTERNAL_ERROR" }
}
