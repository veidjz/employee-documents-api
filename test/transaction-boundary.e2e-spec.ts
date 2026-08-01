import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import { AppModule } from '../src/app.module'
import {
  DOCUMENT_TYPE_REPOSITORY,
  DocumentTypeRepository,
} from '../src/document-types/domain/document-type.repository'
import { DocumentTypeModel } from '../src/document-types/infra/mongo/document-type.schema'
import {
  EMPLOYEE_REPOSITORY,
  EmployeeRepository,
} from '../src/employees/domain/employee.repository'
import { EmployeeModel } from '../src/employees/infra/mongo/employee.schema'
import {
  TRANSACTION_RUNNER,
  TransactionRunner,
} from '../src/shared/domain/transaction-runner'
import { MongoTransactionRunner } from '../src/shared/mongo/mongo-transaction.runner'

describe('Transaction boundary (e2e)', () => {
  let app: INestApplication
  let transactionRunner: TransactionRunner
  let employeeRepository: EmployeeRepository
  let documentTypeRepository: DocumentTypeRepository
  let employees: Model<EmployeeModel>
  let documentTypes: Model<DocumentTypeModel>

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        { provide: TRANSACTION_RUNNER, useClass: MongoTransactionRunner },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    transactionRunner = app.get<TransactionRunner>(TRANSACTION_RUNNER)
    employeeRepository = app.get<EmployeeRepository>(EMPLOYEE_REPOSITORY)
    documentTypeRepository = app.get<DocumentTypeRepository>(
      DOCUMENT_TYPE_REPOSITORY,
    )
    employees = app.get<Model<EmployeeModel>>(getModelToken(EmployeeModel.name))
    documentTypes = app.get<Model<DocumentTypeModel>>(
      getModelToken(DocumentTypeModel.name),
    )

    await employees.syncIndexes()
    await documentTypes.syncIndexes()
  })

  beforeEach(async () => {
    await employees.deleteMany({})
    await documentTypes.deleteMany({})
  })

  afterAll(async () => {
    await app.close()
  })

  async function writeThroughBothRepositories(): Promise<void> {
    await employeeRepository.create({
      name: 'Ana Souza',
      email: 'ana.souza@example.com',
      cpf: '52998224725',
    })
    await documentTypeRepository.create({
      name: 'Carteira de trabalho',
      slug: 'carteira-de-trabalho',
      description: null,
    })
  }

  it('discards every write when the operation throws', async () => {
    await expect(
      transactionRunner.run(async () => {
        await writeThroughBothRepositories()
        throw new Error('rolled back on purpose')
      }),
    ).rejects.toThrow('rolled back on purpose')

    await expect(employees.countDocuments()).resolves.toBe(0)
    await expect(documentTypes.countDocuments()).resolves.toBe(0)
  })
})
