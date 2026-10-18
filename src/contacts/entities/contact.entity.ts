import { ApiProperty } from '@nestjs/swagger';

/** One card of the contacts page. Keys are snake_case on the wire. Never
 * carries `hourly_rate` or a credential (doc/notes/contacts.md). */
export class ContactEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Jean Dupont' })
  name: string;

  @ApiProperty({
    nullable: true,
    example: 'jean@renovation-dupont.be',
    description: 'null = a worker added without email',
  })
  email: string | null;

  @ApiProperty({ nullable: true, example: '+32 470 12 34 56' })
  phone: string | null;

  @ApiProperty({ example: 2, description: '1-7, see roles-permissions.md' })
  role_id: number;

  @ApiProperty({ example: 'manager' })
  role: string;

  @ApiProperty({ description: 'false = shown with an "Inactive" badge' })
  is_active: boolean;

  @ApiProperty({ nullable: true, description: 'null = no photo' })
  avatar_url: string | null;
}

/** An open project of the employee: manager or task assignee. */
export class ContactProjectEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Rénovation Dubois' })
  name: string;

  @ApiProperty({ enum: ['prospect', 'in_progress'] })
  status: string;
}

export class ContactDetailsEntity extends ContactEntity {
  @ApiProperty({ type: [ContactProjectEntity] })
  projects: ContactProjectEntity[];
}
