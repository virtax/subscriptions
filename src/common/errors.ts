import { QueryFailedError } from 'typeorm';

interface PostgresError extends Error {
  code: string;
  detail?: string;
}

function isPostgresError(error: unknown): error is PostgresError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

export function isPostgresConflictError(
  error: unknown,
): error is PostgresError {
  return (
    error instanceof QueryFailedError &&
    isPostgresError(error.driverError) &&
    error.driverError.code === '23505'
  );
}
