import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { ContactsService } from './contacts.service';
import { ApiFindContact, ApiFindContacts } from './decorators/contacts.swagger';
import { FindContactsQueryDto } from './dto/find-contacts-query.dto';

/**
 * The employee directory (doc/notes/contacts.md). Read-only, `contacts:view`
 * (`admin`, `manager` by default). Not the Team routes: no hourly rate here.
 */
@ApiTags('Contacts')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @TenantAuth()
  @Module('contacts')
  @ApiFindContacts()
  findAll(@Query() query: FindContactsQueryDto) {
    return this.contactsService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  @Module('contacts')
  @ApiFindContact()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.findOne(id);
  }
}
