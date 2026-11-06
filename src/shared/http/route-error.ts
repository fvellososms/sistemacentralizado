import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";

/** JSON error response for route handlers: AppError keeps its status and message, anything else is a 500. */
export function errorResponse(error: unknown, fallbackMessage: string, logLabel: string) {
  if (error instanceof AppError) {
    const headers = error.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } : undefined;
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode, headers });
  }
  console.error(`${logLabel}:`, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

/**
 * Message safe to show to the user: AppError and plain `new Error("...")` business messages pass;
 * anything else (database/driver errors, which may carry SQL and values) becomes the fallback.
 */
export function publicErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && Object.getPrototypeOf(error) === Error.prototype && !("cause" in error && error.cause))
    return error.message;
  return fallbackMessage;
}
