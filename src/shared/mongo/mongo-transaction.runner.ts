import { Injectable } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { TransactionRunner } from '../domain/transaction-runner'

@Injectable()
export class MongoTransactionRunner implements TransactionRunner {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  run<T>(operation: () => Promise<T>): Promise<T> {
    return this.connection.transaction(operation, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    })
  }
}
