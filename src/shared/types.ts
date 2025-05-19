export type UUID = string & { readonly _brand: unique symbol };

export function createUUID(): UUID {
  return crypto.randomUUID() as UUID;
}

export type Result<T> = 
  | { success: true; value: T }
  | { success: false; error: string };

export function isSuccess<T>(result: Result<T>): result is { success: true; value: T } {
  return result.success;
}

export function isError<T>(result: Result<T>): result is { success: false; error: string } {
  return !result.success;
}