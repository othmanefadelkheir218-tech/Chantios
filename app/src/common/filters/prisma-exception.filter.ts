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
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Database error',
        };
    }
  }
}
