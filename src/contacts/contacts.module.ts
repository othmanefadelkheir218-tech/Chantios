import { Module } from '@nestjs/common';
import { TokenModule } from '../auth/token.module';
import { MediaModule } from '../media/media.module';
import { ProjectsModule } from '../projects/projects.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { FindContactHandler } from './handlers/find-contact.handler';
import { ListContactsHandler } from './handlers/list-contacts.handler';

/**
 * Step 23 — `GET /api/contacts`, `GET /api/contacts/:id`. No repository and
 * no table: users, photos and projects come from their own services.
 */
@Module({
  imports: [
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    UsersModule,
    MediaModule,
    ProjectsModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService, ListContactsHandler, FindContactHandler],
})
export class ContactsModule {}
