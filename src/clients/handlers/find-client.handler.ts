import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toClientEntity } from '../helpers/clients.helper';
import { ClientRepository } from '../repositories/client.repository';

@Injectable()
export class FindClientHandler {
  constructor(
    @InjectPinoLogger(FindClientHandler.name)
    private readonly logger: PinoLogger,
    private readonly clients: ClientRepository,
  ) {}

  async execute(id: number) {
    const client = await this.clients.findById(id);
    if (!client) {
      this.logger.warn(`Client ${id} not found`);
      throw new NotFoundException('Client not found');
    }
    return toClientEntity(client);
  }
}
