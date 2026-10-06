import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
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
@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin')
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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminUsersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog('deactivate', 'admin_user')
  @ApiDeactivateAdminUser()
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.deactivate(id);
  }
}
