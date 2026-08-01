import { Module } from '@nestjs/common'
import { RequirementPersistenceModule } from '../requirements/requirement-persistence.module'
import { GetOverviewUseCase } from './application/get-overview.usecase'
import { STATS_REPOSITORY } from './domain/stats.repository'
import { StatsController } from './infra/http/stats.controller'
import { MongoStatsRepository } from './infra/mongo/mongo-stats.repository'

@Module({
  imports: [RequirementPersistenceModule],
  controllers: [StatsController],
  providers: [
    GetOverviewUseCase,
    { provide: STATS_REPOSITORY, useClass: MongoStatsRepository },
  ],
})
export class StatsModule {}
