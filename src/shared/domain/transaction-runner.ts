export const TRANSACTION_RUNNER = Symbol('TRANSACTION_RUNNER')

export interface TransactionRunner {
  run<T>(operation: () => Promise<T>): Promise<T>
}
