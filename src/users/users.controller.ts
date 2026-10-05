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
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiDeactivateUser,
  ApiFindUser,
  ApiFindUsers,
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
@Public() // TODO: step 02 wiring — AuthGuard + PermissionGuard(team) once attached
@UseInterceptors(SnakeCaseInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiFindUsers()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  // Must stay registered before `GET/PATCH :id` — both match one path segment.
  @Patch('me')
  @ApiUpdateProfile()
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.updateOwnProfile(dto, actor);
  }

  @Get(':id')
  @ApiFindUser()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateUser()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, actor);
  }

  @Delete(':id')
  @ApiDeactivateUser()
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.deactivate(id, actor);
  }

  @Post(':id/pin')
  @ApiSetPin()
  setPin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPinDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.setMobilePin(id, dto, actor);
  }
}
