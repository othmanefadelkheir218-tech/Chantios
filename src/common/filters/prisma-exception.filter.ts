import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Safety net: turns known Prisma errors into clean HTTP errors.
 * Handlers already check business rules; this covers race conditions
 * (two requests creating the same phone at the same time).
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, error, message } = this.map(exception);
    response.status(statusCode).json({ statusCode, error, message });
  }

  private map(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'This value is already used',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Record not found',
        };
      // Prisma has no dedicated code for a raw Postgres error (a CHECK
      // constraint, or a unique/partial index Prisma's schema doesn't know
      // about — this app has 5 of those, hand-written in the migration). It
      // wraps the real error under `meta`. Handlers already validate the
      // business rules that back most of these (belt-and-suspenders); this
      // is the fallback for whatever a handler missed, or a future module
      // that forgets to check first.
      case 'P2039': {
        const pgCode = this.pgErrorCode(exception);
        if (pgCode?.startsWith('23')) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: this.pgErrorMessage(exception) ?? 'Invalid data',
          };
        }
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Database error',
        };
      }
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Database error',
        };
    }
  }

  /** Postgres SQLSTATE (e.g. `23514` = check_violation), buried under `meta`. */
  private pgErrorCode(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | undefined {
    const meta = exception.meta as
      { driverAdapterError?: { cause?: { code?: string } } } | undefined;
    return meta?.driverAdapterError?.cause?.code;
  }

  private pgErrorMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | undefined {
    const meta = exception.meta as
      { driverAdapterError?: { cause?: { message?: string } } } | undefined;
    return meta?.driverAdapterError?.cause?.message;
  }
}
