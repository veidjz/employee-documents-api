import { IsIn, IsMongoId, IsOptional } from 'class-validator'
import { PaginationQuery } from '../../../../shared/http/pagination.query'
import {
  REQUIREMENT_STATUSES,
  type RequirementStatus,
} from '../../../domain/requirement'

export class ListRequirementsQuery extends PaginationQuery {
  @IsOptional()
  @IsIn(REQUIREMENT_STATUSES)
  status?: RequirementStatus

  @IsOptional()
  @IsMongoId()
  employeeId?: string

  @IsOptional()
  @IsMongoId()
  documentTypeId?: string
}
