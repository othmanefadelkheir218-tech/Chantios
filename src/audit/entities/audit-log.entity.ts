import { ApiProperty } from '@nestjs/swagger';

export class AuditLogEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    description: 'The company concerned — null for a platform-only action',
    format: 'uuid',
    nullable: true,
  })
  tenant_id: string | null;

  @ApiProperty({
    description:
      'The platform admin who acted — null until step 02 brings the login',
    format: 'uuid',
    nullable: true,
  })
  admin_user_id: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  user_id: string | null;

  @ApiProperty({ example: 'set_status' })
  action: string;

  @ApiProperty({ example: 'tenant' })
  entity_type: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  entity_id: string | null;

  @ApiProperty({
    description: 'Value before the change (secrets are redacted)',
    nullable: true,
    type: Object,
  })
  old_value: unknown;

  @ApiProperty({
    description: 'Value after the change (secrets are redacted)',
    nullable: true,
    type: Object,
  })
  new_value: unknown;

  @ApiProperty({ nullable: true, example: '127.0.0.1' })
  ip_address: string | null;

  @ApiProperty()
  created_at: Date;
}
