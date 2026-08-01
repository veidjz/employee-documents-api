import { Body, Controller, Param, Post } from '@nestjs/common'
import { ParseObjectIdPipe } from '../../../shared/http/object-id.pipe'
import { SubmitDocumentUseCase } from '../../application/submit-document.usecase'
import { SubmitDocumentBody } from './dto/submit-document.body'
import { SubmissionView, toSubmissionView } from './dto/submission.view'

@Controller('requirements/:requirementId/submissions')
export class RequirementSubmissionsController {
  constructor(private readonly submitDocument: SubmitDocumentUseCase) {}

  @Post()
  async submit(
    @Param('requirementId', ParseObjectIdPipe) requirementId: string,
    @Body() body: SubmitDocumentBody,
  ): Promise<SubmissionView> {
    return toSubmissionView(
      await this.submitDocument.execute(requirementId, body),
    )
  }
}
