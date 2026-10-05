import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
  ApiAcceptInvitation,
  ApiCreateInvitation,
  ApiFindInvitations,
  ApiResendInvitation,
  ApiRevokeInvitation,
  ApiVerifyInvitation,
} from './decorators/invitations.swagger';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { FindInvitationsQueryDto } from './dto/find-invitations-query.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('Invitations')
@Public() // TODO: step 02 wiring — AuthGuard + admin role, except verify/accept which stay public
@UseInterceptors(SnakeCaseInterceptor)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiCreateInvitation()
  create(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invitationsService.create(dto, actor);
  }

  @Get()
  @ApiFindInvitations()
  findAll(@Query() query: FindInvitationsQueryDto) {
    return this.invitationsService.findAll(query);
  }

  @Get('verify/:token')
  @ApiVerifyInvitation()
  verify(@Param('token') token: string) {
    return this.invitationsService.verify(token);
  }

  @Post('accept')
  @ApiAcceptInvitation()
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.accept(dto);
  }

  @Post(':id/resend')
  @ApiResendInvitation()
  resend(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invitationsService.resend(id, actor);
  }

  @Delete(':id')
  @ApiRevokeInvitation()
  revoke(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invitationsService.revoke(id, actor);
  }
}
