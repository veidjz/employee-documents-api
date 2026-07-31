import { MongoMemoryReplSet } from 'mongodb-memory-server'

let replicaSet: MongoMemoryReplSet | undefined

export default async function startMongo(): Promise<void> {
  if (process.env.MONGO_URL) {
    return
  }

  replicaSet = await MongoMemoryReplSet.create()
  process.env.MONGO_URL = replicaSet.getUri('inmeta')
}

export async function stopMongo(): Promise<void> {
  await replicaSet?.stop()
}
