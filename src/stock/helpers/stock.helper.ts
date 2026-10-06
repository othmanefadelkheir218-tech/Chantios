import { BadRequestException } from '@nestjs/common';
import { Prisma, StockMovement, StockReservation } from '@prisma/client';

export function toMovementEntity(movement: StockMovement) {
  return {
    id: movement.id,
    tenantId: movement.tenantId,
    materialId: movement.materialId,
    projectId: movement.projectId,
    reportId: movement.reportId,
    purchaseInvoiceId: movement.purchaseInvoiceId,
    type: movement.type,
    quantity: movement.quantity,
    unitPrice: movement.unitPrice,
    movementDate: movement.movementDate,
    note: movement.note,
    createdBy: movement.createdBy,
    createdAt: movement.createdAt,
  };
}

export function toReservationEntity(reservation: StockReservation) {
  return {
    id: reservation.id,
    tenantId: reservation.tenantId,
    projectId: reservation.projectId,
    materialId: reservation.materialId,
    reservedQuantity: reservation.reservedQuantity,
    remainingQuantity: reservation.remainingQuantity,
    status: reservation.status,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
}

/** Builds the Prisma filter for the movements list. */
export function buildMovementFilter(
  materialId?: number,
  projectId?: number,
  type?: StockMovement['type'],
  from?: string,
  to?: string,
): Prisma.StockMovementWhereInput {
  return {
    ...(materialId !== undefined && { materialId }),
    ...(projectId !== undefined && { projectId }),
    ...(type !== undefined && { type }),
    ...((from || to) && {
      movementDate: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  };
}

/** Builds the Prisma filter for the reservations list. */
export function buildReservationFilter(
  projectId?: number,
  materialId?: number,
): Prisma.StockReservationWhereInput {
  return {
    ...(projectId !== undefined && { projectId }),
    ...(materialId !== undefined && { materialId }),
  };
}

/** `stock_movements.quantity` must never be 0 — the DB CHECK backs this too. */
export function assertNonZeroQuantity(value: string): void {
  if (Number(value) === 0) {
    throw new BadRequestException('quantity cannot be 0');
  }
}

/** A purchase's quantity must be strictly positive. */
export function assertPositiveQuantity(value: string): void {
  if (Number(value) <= 0) {
    throw new BadRequestException('quantity must be positive');
  }
}
