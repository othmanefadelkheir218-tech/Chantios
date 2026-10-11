import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { callArg } from '../../common/testing/spec-helpers';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { RecordImportedMovementsHandler } from './record-imported-movements.handler';

const actor = { userId: 1, tenantId: 1 };
const material = { id: 5, purchasePrice: new Prisma.Decimal('6.00') };
const tx = { tx: true } as never;

describe('RecordImportedMovementsHandler', () => {
  const movements = { createMany: jest.fn() };
  let handler: RecordImportedMovementsHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RecordImportedMovementsHandler,
        { provide: StockMovementRepository, useValue: movements },
        {
          provide: getLoggerToken(RecordImportedMovementsHandler.name),
          useValue: { info: jest.fn() },
        },
      ],
    }).compile();
    handler = module.get(RecordImportedMovementsHandler);
  });

  it('writes the rows at the material price, with the batch id, no project', async () => {
    movements.createMany.mockResolvedValue(2);
    await handler.execute(
      [
        { material, type: 'purchase', quantity: '10' },
        { material, type: 'adjustment', quantity: '-1', note: ' Casse ' },
      ],
      9,
      actor,
      tx,
    );
    const rows = callArg<Array<Record<string, unknown>>>(
      movements.createMany,
      0,
      0,
    );
    expect(rows[0]).toEqual(
      expect.objectContaining({
        type: 'purchase',
        projectId: null,
        unitPrice: material.purchasePrice,
        importBatchId: 9,
        createdBy: 1,
      }),
    );
    expect(rows[1].note).toBe('Casse');
    expect(callArg(movements.createMany, 0, 1)).toBe(tx);
  });

  it('keeps the single-route rules: no negative purchase, no adjustment without note', async () => {
    await expect(
      handler.execute(
        [{ material, type: 'purchase', quantity: '-1' }],
        9,
        actor,
        tx,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      handler.execute(
        [{ material, type: 'adjustment', quantity: '2' }],
        9,
        actor,
        tx,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(movements.createMany).not.toHaveBeenCalled();
  });
});
