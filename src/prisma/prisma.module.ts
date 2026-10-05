import { Global, Module } from '@nestjs/common';
import { CommonClsModule } from '../common/cls/cls.module';
import { TenantPrismaService } from '../common/prisma/tenant-prisma.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [CommonClsModule],
  providers: [PrismaService, TenantPrismaService],
  exports: [PrismaService, TenantPrismaService],
})
export class PrismaModule {}
