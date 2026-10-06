import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
}

function makeHost() {
  const json = jest.fn<void, [ErrorBody]>();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

function knownError(
  code: string,
  meta?: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test message', {
    code,
    clientVersion: '7.10.0',
    meta,
  });
}

describe('PrismaExceptionFilter', () => {
  const filter = new PrismaExceptionFilter();

  it('P2002 -> 409 Conflict', () => {
    const { host, status, json } = makeHost();
    filter.catch(knownError('P2002'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.CONFLICT }),
    );
  });

  it('P2025 -> 404 Not Found', () => {
    const { host, status } = makeHost();
    filter.catch(knownError('P2025'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('P2039 wrapping a Postgres CHECK violation (23514) -> 400 Bad Request with the DB message', () => {
    const { host, status, json } = makeHost();
    filter.catch(
      knownError('P2039', {
        driverAdapterError: {
          cause: {
            code: '23514',
            message:
              'new row for relation "clients" violates check constraint "chk_professional_has_vat"',
          },
        },
      }),
      host,
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.message).toContain('chk_professional_has_vat');
  });

  it('P2039 wrapping a non-integrity Postgres error -> 500 (unknown shape, safe fallback)', () => {
    const { host, status } = makeHost();
    filter.catch(
      knownError('P2039', {
        driverAdapterError: {
          cause: { code: '08006', message: 'connection failure' },
        },
      }),
      host,
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('an unmapped code -> 500 Internal Server Error', () => {
    const { host, status } = makeHost();
    filter.catch(knownError('P2003'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
