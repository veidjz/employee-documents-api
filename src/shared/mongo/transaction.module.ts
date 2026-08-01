import { Module } from '@nestjs/common'
import { TRANSACTION_RUNNER } from '../domain/transaction-runner'
import { MongoTransactionRunner } from './mongo-transaction.runner'

@Module({
  providers: [
    { provide: TRANSACTION_RUNNER, useClass: MongoTransactionRunner },
  ],
  exports: [TRANSACTION_RUNNER],
})
export class TransactionModule {}
