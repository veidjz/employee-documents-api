import { NestFactory } from '@nestjs/core'
import { getModelToken } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { AppModule } from '../src/app.module'
import { DocumentTypeModel } from '../src/document-types/infra/mongo/document-type.schema'
import { EmployeeModel } from '../src/employees/infra/mongo/employee.schema'
import { RequirementModel } from '../src/requirements/infra/mongo/requirement.schema'
import { SubmissionModel } from '../src/requirements/infra/mongo/submission.schema'

function objectId(suffix: string) {
  return new Types.ObjectId(suffix.padStart(24, '0'))
}

const ana = objectId('a1')
const bruno = objectId('a2')
const carla = objectId('a3')
const diego = objectId('a4')

const workCard = objectId('b1')
const proofOfAddress = objectId('b2')
const militaryCertificate = objectId('b3')

const anaWorkCard = objectId('c1')
const brunoWorkCard = objectId('c3')
const carlaMilitaryCertificate = objectId('c5')

const removedAt = new Date('2026-07-20T12:00:00.000Z')

const employees = [
  {
    _id: ana,
    name: 'Ana Souza',
    email: 'ana.souza@example.com',
    cpf: '52998224725',
  },
  {
    _id: bruno,
    name: 'Bruno Lima',
    email: 'bruno.lima@example.com',
    cpf: '11144477735',
  },
  {
    _id: carla,
    name: 'Carla Nunes',
    email: 'carla.nunes@example.com',
    cpf: '39053344705',
  },
  {
    _id: diego,
    name: 'Diego Alves',
    email: 'diego.alves@example.com',
    cpf: '16899535009',
    deletedAt: removedAt,
  },
]

const documentTypes = [
  {
    _id: workCard,
    name: 'Carteira de Trabalho',
    slug: 'carteira-de-trabalho',
    description: 'CTPS digital ou as folhas de identificação da física',
  },
  {
    _id: proofOfAddress,
    name: 'Comprovante de Residência',
    slug: 'comprovante-de-residencia',
    description: 'Emitido nos últimos três meses',
  },
  {
    _id: militaryCertificate,
    name: 'Certificado de Reservista',
    slug: 'certificado-de-reservista',
  },
]

const requirements = [
  {
    _id: anaWorkCard,
    employeeId: ana,
    documentTypeId: workCard,
    status: 'SUBMITTED' as const,
    currentVersion: 2,
    lastSubmittedAt: new Date('2026-07-15T14:30:00.000Z'),
  },
  { _id: objectId('c2'), employeeId: ana, documentTypeId: proofOfAddress },
  {
    _id: brunoWorkCard,
    employeeId: bruno,
    documentTypeId: workCard,
    status: 'SUBMITTED' as const,
    currentVersion: 1,
    lastSubmittedAt: new Date('2026-07-10T09:00:00.000Z'),
  },
  {
    _id: objectId('c4'),
    employeeId: bruno,
    documentTypeId: militaryCertificate,
  },
  {
    _id: carlaMilitaryCertificate,
    employeeId: carla,
    documentTypeId: militaryCertificate,
    status: 'SUBMITTED' as const,
    currentVersion: 1,
    lastSubmittedAt: new Date('2026-07-18T16:45:00.000Z'),
  },
  {
    _id: objectId('c6'),
    employeeId: diego,
    documentTypeId: workCard,
    deletedAt: removedAt,
  },
]

const submissions = [
  {
    _id: objectId('d1'),
    requirementId: anaWorkCard,
    employeeId: ana,
    documentTypeId: workCard,
    version: 1,
    isActive: false,
    fileName: 'ctps-ana-souza.pdf',
    contentType: 'application/pdf',
    sizeBytes: 184320,
    submittedAt: new Date('2026-07-02T11:20:00.000Z'),
  },
  {
    _id: objectId('d2'),
    requirementId: anaWorkCard,
    employeeId: ana,
    documentTypeId: workCard,
    version: 2,
    fileName: 'ctps-ana-souza-corrigida.pdf',
    contentType: 'application/pdf',
    sizeBytes: 192512,
    submittedAt: new Date('2026-07-15T14:30:00.000Z'),
  },
  {
    _id: objectId('d3'),
    requirementId: brunoWorkCard,
    employeeId: bruno,
    documentTypeId: workCard,
    version: 1,
    fileName: 'ctps-bruno-lima.pdf',
    contentType: 'application/pdf',
    sizeBytes: 205824,
    submittedAt: new Date('2026-07-10T09:00:00.000Z'),
  },
  {
    _id: objectId('d4'),
    requirementId: carlaMilitaryCertificate,
    employeeId: carla,
    documentTypeId: militaryCertificate,
    version: 1,
    fileName: 'reservista-carla-nunes.pdf',
    contentType: 'application/pdf',
    sizeBytes: 98304,
    submittedAt: new Date('2026-07-18T16:45:00.000Z'),
  },
]

async function seed() {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })

  const employeeModel = application.get<Model<EmployeeModel>>(
    getModelToken(EmployeeModel.name),
  )
  const documentTypeModel = application.get<Model<DocumentTypeModel>>(
    getModelToken(DocumentTypeModel.name),
  )
  const requirementModel = application.get<Model<RequirementModel>>(
    getModelToken(RequirementModel.name),
  )
  const submissionModel = application.get<Model<SubmissionModel>>(
    getModelToken(SubmissionModel.name),
  )

  await Promise.all([
    employeeModel.deleteMany({}),
    documentTypeModel.deleteMany({}),
    requirementModel.deleteMany({}),
    submissionModel.deleteMany({}),
  ])

  await employeeModel.insertMany(employees)
  await documentTypeModel.insertMany(documentTypes)
  await requirementModel.insertMany(requirements)
  await submissionModel.insertMany(submissions)

  console.log(
    `seeded ${employees.length} employees, ${documentTypes.length} document types, ${requirements.length} requirements and ${submissions.length} submissions`,
  )

  await application.close()
}
void seed()
