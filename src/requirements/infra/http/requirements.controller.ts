import { Controller, Get, Query } from '@nestjs/common'
import { ApiProblemResponses } from '@shared/http/api-problem.decorator'
import { toPageView } from '@shared/http/page.view'
import { ListRequirementsUseCase } from '../../application/list-requirements.usecase'
import { ListRequirementsQuery } from './dto/list-requirements.query'
import { RequirementPageView } from './dto/requirement.view'

@Controller('requirements')
export class RequirementsController {
  constructor(private readonly listRequirements: ListRequirementsUseCase) {}

  @Get()
  @ApiProblemResponses(400)
  async list(
    @Query() query: ListRequirementsQuery,
  ): Promise<RequirementPageView> {
    const { page, limit, ...filters } = query
    const pagination = { page, limit }

    return toPageView(
      await this.listRequirements.execute(filters, pagination),
      pagination,
    )
  }
}
