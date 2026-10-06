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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  SessionAuth,
  TenantAuth,
} from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiDeactivateUser,
  ApiFindUser,
  ApiFindUsers,
  ApiReplaceAvatar,
  ApiSetPin,
  ApiUpdateProfile,
  ApiUpdateUser,
} from './decorators/users.swagger';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @TenantAuth()
  @Module('team')
  @ApiFindUsers()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  // Must stay registered before `GET/PATCH :id` — both match one path segment.
  @Patch('me')
  @TenantAuth()
  @ApiUpdateProfile()
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.updateOwnProfile(dto, actor);
  }

  // Must stay registered before `GET :id` — both match one path segment
  // with `me` (`PATCH` above already does; `POST` has no `:id` route today,
  // kept defensive in case one is added later).
  @Post('me/avatar')
  @SessionAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiReplaceAvatar()
  replaceAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.replaceOwnAvatar(file, actor);
  }

  @Get(':id')
  @TenantAuth()
  @Module('team')
  @ApiFindUser()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @TenantAuth()
  @Roles('admin')
  @ApiUpdateUser()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, actor);
  }

  @Delete(':id')
  @TenantAuth()
  @Roles('admin')
  @ApiDeactivateUser()
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.deactivate(id, actor);
  }

  @Post(':id/pin')
  @TenantAuth()
  @Roles('admin')
  @ApiSetPin()
  setPin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPinDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.setMobilePin(id, dto, actor);
  }
}
