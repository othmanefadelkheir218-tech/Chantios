import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { ProjectsModule } from '../projects/projects.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TasksModule } from '../tasks/tasks.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { CreateTimeEntryHandler } from './handlers/create-time-entry.handler';
import { DeleteTimeEntryHandler } from './handlers/delete-time-entry.handler';
import { FindTimeEntriesHandler } from './handlers/find-time-entries.handler';
import { ProjectLabourCostHandler } from './handlers/project-labour-cost.handler';
import { UpdateTimeEntryHandler } from './handlers/update-time-entry.handler';
import { MobileTimeEntriesController } from './mobile-time-entries.controller';
import { ProjectLabourCostController } from './project-labour-cost.controller';
import { TimeEntryRepository } from './repositories/time-entry.repository';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';

@Module({
  imports: [
    AuditModule,
    ProjectsModule, // validates `project_id` through `ProjectsService`
    TasksModule, // the worker project-assignment check + `task_id` validation
    UsersModule, // the active user + the hourly rate to freeze
    // What `@TenantAuth()`'s guards need to resolve their own dependencies.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [
    TimeEntriesController,
    MobileTimeEntriesController,
    ProjectLabourCostController,
  ],
  providers: [
    TimeEntriesService,
    TimeEntryRepository,
    CreateTimeEntryHandler,
    FindTimeEntriesHandler,
    UpdateTimeEntryHandler,
    DeleteTimeEntryHandler,
    ProjectLabourCostHandler,
  ],
  // Step 10 (margin) reads the labour cost through this service.
  exports: [TimeEntriesService],
})
export class TimeEntriesModule {}
