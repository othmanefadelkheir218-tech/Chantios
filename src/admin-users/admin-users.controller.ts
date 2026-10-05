import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AdminUsersService } from './admin-users.service';
import {
  ApiCreateAdminUser,
  ApiDeactivateAdminUser,
  ApiFindAdminUsers,
  ApiUpdateAdminUser,
} from './decorators/admin-users.swagger';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { FindAdminUsersQueryDto } from './dto/find-admin-users-query.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@ApiTags('Admin users')
@Public() // TODO: step 02 — AdminAuthGuard (super_admin)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/admin-users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @AuditLog('create', 'admin_user')
  @ApiCreateAdminUser()
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.create(dto);
  }

  @Get()
  @ApiFindAdminUsers()
  findAll(@Query() query: FindAdminUsersQueryDto) {
    return this.adminUsersService.findAll(query);
  }

  @Patch(':id')
  @AuditLog('update', 'admin_user')
  @ApiUpdateAdminUser()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminUsersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog('deactivate', 'admin_user')
  @ApiDeactivateAdminUser()
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsersService.deactivate(id);
  }
}
