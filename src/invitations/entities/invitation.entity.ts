import { ApiProperty } from '@nestjs/swagger';

/** Response shape of an invitation. Never carries `token_hash`. */
export class InvitationEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tenant_id: number;

  @ApiProperty({ example: 'jean@renovation-dupont.be' })
  email: string;

  @ApiProperty({ example: 'Jean Dupont' })
  name: string;

  @ApiProperty({ example: 5 })
  role_id: number;

  @ApiProperty()
  invited_by: number;

  @ApiProperty()
  expires_at: Date;

  @ApiProperty({ nullable: true, description: 'null = still open' })
  accepted_at: Date | null;

  @ApiProperty()
  created_at: Date;
}
