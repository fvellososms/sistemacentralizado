import { AppError } from "./AppError";
import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError } from "./database-errors";

/** Runs a database operation, turning connection failures into a 503 with the "banco indisponível" message. */
export async function withDatabase<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.error("Banco de dados inacessível:", error);
      throw AppError.serviceUnavailable(DATABASE_UNAVAILABLE_MESSAGE, "DATABASE_UNAVAILABLE");
    }
    throw error;
  }
}
