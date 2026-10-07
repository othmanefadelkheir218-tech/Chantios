import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { CreateTaskHandler } from './handlers/create-task.handler';
import { DeleteTaskHandler } from './handlers/delete-task.handler';
import { FindTasksHandler } from './handlers/find-tasks.handler';
import { MyTasksHandler } from './handlers/my-tasks.handler';
import { SetAssigneesHandler } from './handlers/set-assignees.handler';
import { SetTaskStatusHandler } from './handlers/set-task-status.handler';
import { UpdateTaskHandler } from './handlers/update-task.handler';
import { MobileTasksController } from './mobile-tasks.controller';
import { TaskRepository } from './repositories/task.repository';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    AuditModule,
    ProjectsModule, // validates `project_id` through `ProjectsService`
    UsersModule, // validates assignees through `UsersService`
    NotificationsModule, // task_assigned / task_status_changed
    // What `@TenantAuth()`'s guards need to resolve their own dependencies.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [TasksController, MobileTasksController],
  providers: [
    TasksService,
    TaskRepository,
    CreateTaskHandler,
    FindTasksHandler,
    MyTasksHandler,
    UpdateTaskHandler,
    SetTaskStatusHandler,
    SetAssigneesHandler,
    DeleteTaskHandler,
  ],
  // `time-entries` asks `TasksService` whether a worker is assigned to a project.
  exports: [TasksService],
})
export class TasksModule {}
