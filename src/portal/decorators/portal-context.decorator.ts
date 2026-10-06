import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** What `PortalTokenGuard` resolved the URL token to. There is no user: the token IS the identity. */
export interface PortalContextData {
  tokenId: number;
  tenantId: number;
  projectId: number;
  clientId: number;
  expiresAt: Date;
  ip: string | null;
}

/** Reads `req.portal`, set by `PortalTokenGuard` — the only thing a client route knows about its caller. */
export const PortalContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PortalContextData =>
    (
      context.switchToHttp().getRequest<Request>() as unknown as {
        portal: PortalContextData;
      }
    ).portal,
);
