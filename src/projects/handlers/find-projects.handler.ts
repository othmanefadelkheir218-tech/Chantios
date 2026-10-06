import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindProjectsQueryDto } from '../dto/find-projects-query.dto';
import { buildProjectFilter, toProjectEntity } from '../helpers/project.helper';
import { ProjectRepository } from '../repositories/project.repository';

@Injectable()
export class FindProjectsHandler {
  constructor(
    @InjectPinoLogger(FindProjectsHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectRepository,
  ) {}

  async execute({
    page,
    limit,
    status,
    client_id,
    search,
  }: FindProjectsQueryDto) {
    this.logger.debug(`Listing projects (page ${page}, limit ${limit})`);

    const [data, total] = await this.projects.findMany(
      buildProjectFilter(status, client_id, search),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toProjectEntity), total, page, limit);
  }
}
