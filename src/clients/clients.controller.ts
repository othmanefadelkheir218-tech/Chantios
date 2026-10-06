import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiArchiveClient,
  ApiCreateClient,
  ApiFindClient,
  ApiFindClients,
  ApiUpdateClient,
} from './decorators/clients.swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { FindClientsQueryDto } from './dto/find-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @TenantAuth()
  @Module('clients')
  @ApiCreateClient()
  create(
    @Body() dto: CreateClientDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientsService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('clients')
  @ApiFindClients()
  findAll(@Query() query: FindClientsQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  @Module('clients')
  @ApiFindClient()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('clients')
  @ApiUpdateClient()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientsService.update(id, dto, actor);
  }

  @Delete(':id')
  @TenantAuth()
  @Module('clients')
  @ApiArchiveClient()
  archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientsService.archive(id, actor);
  }
}
