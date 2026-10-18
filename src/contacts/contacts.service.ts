import { Injectable } from '@nestjs/common';
import { FindContactsQueryDto } from './dto/find-contacts-query.dto';
import { FindContactHandler } from './handlers/find-contact.handler';
import { ListContactsHandler } from './handlers/list-contacts.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class ContactsService {
  constructor(
    private readonly listContacts: ListContactsHandler,
    private readonly findContact: FindContactHandler,
  ) {}

  findAll(query: FindContactsQueryDto) {
    return this.listContacts.execute(query);
  }

  findOne(id: number) {
    return this.findContact.execute(id);
  }
}
