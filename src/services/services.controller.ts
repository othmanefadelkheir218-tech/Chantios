import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateServiceDto } from './dto/create-service.dto';
import { FindServicesQueryDto } from './dto/find-services-query.dto';
import { SetRecipeDto } from './dto/set-recipe.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('Services')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @TenantAuth()
  @Module('catalogue')
  create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.servicesService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('catalogue')
  findAll(@Query() query: FindServicesQueryDto) {
    return this.servicesService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  @Module('catalogue')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('catalogue')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.servicesService.update(id, dto, actor);
  }

  @Delete(':id')
  @TenantAuth()
  @Module('catalogue')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.servicesService.archive(id, actor);
  }

  @Get(':id/recipe')
  @TenantAuth()
  @Module('catalogue')
  getRecipe(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.recipe(id);
  }

  /** Replaces the whole recipe, one transaction. */
  @Put(':id/recipe')
  @TenantAuth()
  @Module('catalogue')
  setRecipe(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetRecipeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.servicesService.replaceRecipe(id, dto, actor);
  }
}
