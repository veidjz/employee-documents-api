import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ParseObjectIdPipe } from '@shared/http/object-id.pipe'
import { toPageView } from '@shared/http/page.view'
import { PaginationQuery } from '@shared/http/pagination.query'
import { ListSubmissionsUseCase } from '../../application/list-submissions.usecase'
import { SubmitDocumentUseCase } from '../../application/submit-document.usecase'
import {
  SubmissionPageView,
  SubmissionView,
  toSubmissionView,
} from './dto/submission.view'
import { SubmitDocumentBody } from './dto/submit-document.body'

@Controller('requirements/:requirementId/submissions')
export class RequirementSubmissionsController {
  constructor(
    private readonly submitDocument: SubmitDocumentUseCase,
    private readonly listSubmissions: ListSubmissionsUseCase,
  ) {}

  @Post()
  async submit(
    @Param('requirementId', ParseObjectIdPipe) requirementId: string,
    @Body() body: SubmitDocumentBody,
  ): Promise<SubmissionView> {
    return toSubmissionView(
      await this.submitDocument.execute(requirementId, body),
    )
  }

  @Get()
  async list(
    @Param('requirementId', ParseObjectIdPipe) requirementId: string,
    @Query() pagination: PaginationQuery,
  ): Promise<SubmissionPageView> {
    const page = await this.listSubmissions.execute(requirementId, pagination)

    return toPageView(
      { ...page, data: page.data.map(toSubmissionView) },
      pagination,
    )
  }
}
