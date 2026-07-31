import { MongoMemoryReplSet } from 'mongodb-memory-server'

let replicaSet: MongoMemoryReplSet

export default async function startMongo(): Promise<void> {
  replicaSet = await MongoMemoryReplSet.create()
  process.env.MONGO_URL = replicaSet.getUri('inmeta')
}

export async function stopMongo(): Promise<void> {
  await replicaSet.stop()
}
