import { Injectable } from '@nestjs/common';
import { Client } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { FindClientsQueryDto } from './dto/find-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ArchiveClientHandler } from './handlers/archive-client.handler';
import { CreateClientHandler } from './handlers/create-client.handler';
import { FindClientHandler } from './handlers/find-client.handler';
import { FindClientsHandler } from './handlers/find-clients.handler';
import { UpdateClientHandler } from './handlers/update-client.handler';
import { ClientRepository } from './repositories/client.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class ClientsService {
  constructor(
    private readonly clients: ClientRepository,
    private readonly createClient: CreateClientHandler,
    private readonly findClients: FindClientsHandler,
    private readonly findClient: FindClientHandler,
    private readonly updateClient: UpdateClientHandler,
    private readonly archiveClient: ArchiveClientHandler,
  ) {}

  create(dto: CreateClientDto, actor: AuthenticatedUser) {
    return this.createClient.execute(dto, actor);
  }

  findAll(query: FindClientsQueryDto) {
    return this.findClients.execute(query);
  }

  findOne(id: number) {
    return this.findClient.execute(id);
  }

  update(id: number, dto: UpdateClientDto, actor: AuthenticatedUser) {
    return this.updateClient.execute(id, dto, actor);
  }

  archive(id: number, actor: AuthenticatedUser) {
    return this.archiveClient.execute(id, actor);
  }

  // ---- Internal API for `projects` ----

  /**
   * Raw Prisma row (not the public entity) — `projects` calls this through
   * this service, never the repository, to validate `client_id` on create.
   */
  findByIdRaw(id: number): Promise<Client | null> {
    return this.clients.findById(id);
  }

  /** The `max_clients` billing dimension (step 14). */
  countActive(): Promise<number> {
    return this.clients.countActive();
  }
}
