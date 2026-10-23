import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ClientRepository } from '../repositories/client.repository';

/**
 * Adds an extra address to a client (doc/notes/client-email.md § Who is the
 * client). Never automatic: a user confirms "New address for <client>".
 * An address belongs to one client of the company only.
 */
@Injectable()
export class AddClientEmailHandler {
  constructor(
    @InjectPinoLogger(AddClientEmailHandler.name)
    private readonly logger: PinoLogger,
    private readonly clients: ClientRepository,
  ) {}

  async execute(clientId: number, rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    this.logger.info(`Adding an email address to client ${clientId}`);

    const client = await this.clients.findById(clientId);
    if (!client) {
      this.logger.warn(`Cannot add address: client ${clientId} not found`);
      throw new NotFoundException('Client not found');
    }
    const owner = await this.clients.findByAnyEmail(email);
    if (owner) {
      this.logger.warn(
        `Cannot add address to client ${clientId}: already used by client ${owner.id}`,
      );
      throw new ConflictException(
        owner.id === clientId
          ? 'This address is already one of this client'
          : 'This address belongs to another client',
      );
    }

    const row = await this.clients.addEmail(clientId, email);
    this.logger.info(`Address ${row.id} added to client ${clientId}`);
    return { id: row.id, clientId, email: row.email, createdAt: row.createdAt };
  }
}
