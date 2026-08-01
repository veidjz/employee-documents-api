import { Requirement } from '../src/requirements/domain/requirement'
import { RequirementRepository } from '../src/requirements/domain/requirement.repository'
import { Submission } from '../src/requirements/domain/submission'
import { SubmissionRepository } from '../src/requirements/domain/submission.repository'
import { SubmitDocumentUseCase } from '../src/requirements/application/submit-document.usecase'
import { NotFoundError } from '../src/shared/domain/domain-error'
import { Page } from '../src/shared/domain/page'
import { TransactionRunner } from '../src/shared/domain/transaction-runner'

class CountingSubmissionRepository implements SubmissionRepository {
  inserts = 0

  create(): Promise<Submission> {
    this.inserts += 1

    return Promise.reject(new Error('Unexpected insert'))
  }

  deactivateActive(): Promise<void> {
    return Promise.resolve()
  }

  listByRequirement(): Promise<Page<Submission>> {
    return Promise.reject(new Error('Unexpected history read'))
  }

  softDeleteByRequirements(): Promise<void> {
    return Promise.reject(new Error('Unexpected requirement cascade'))
  }

  reviveByRequirements(): Promise<void> {
    return Promise.reject(new Error('Unexpected revive'))
  }
}

class MissingRequirementRepository implements RequirementRepository {
  reserveNextVersion(): Promise<Requirement | null> {
    return Promise.resolve(null)
  }

  findById(): Promise<Requirement | null> {
    return Promise.resolve(null)
  }

  link(): Promise<Requirement> {
    return Promise.reject(new Error('Unexpected link'))
  }

  list(): Promise<Page<Requirement>> {
    return Promise.reject(new Error('Unexpected listing'))
  }

  unlink(): Promise<string | null> {
    return Promise.reject(new Error('Unexpected unlink'))
  }

  softDeleteByEmployee(): Promise<string[]> {
    return Promise.reject(new Error('Unexpected employee cascade'))
  }

  softDeleteByDocumentType(): Promise<string[]> {
    return Promise.reject(new Error('Unexpected document type cascade'))
  }
}

const inlineTransaction: TransactionRunner = {
  run: (operation) => operation(),
}

describe('SubmitDocumentUseCase', () => {
  it('rejects a submission to a requirement that does not exist', async () => {
    const submissions = new CountingSubmissionRepository()
    const submitDocument = new SubmitDocumentUseCase(
      new MissingRequirementRepository(),
      submissions,
      inlineTransaction,
    )

    await expect(
      submitDocument.execute('68a1c0de5f2b4c0012ab34cd', {
        fileName: 'aso-ana.pdf',
        contentType: 'application/pdf',
        sizeBytes: 184320,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(submissions.inserts).toBe(0)
  })
})
