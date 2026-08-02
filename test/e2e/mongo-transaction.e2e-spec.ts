import { Connection, createConnection } from 'mongoose'

describe('Mongo transaction (e2e)', () => {
  let connection: Connection

  beforeAll(async () => {
    connection = await createConnection(
      process.env.MONGO_URL as string,
    ).asPromise()
    await connection.createCollection('transaction_probes')
    await connection.createCollection('transaction_probe_entries')
  })

  afterEach(async () => {
    await connection.collection('transaction_probes').deleteMany({})
    await connection.collection('transaction_probe_entries').deleteMany({})
  })

  afterAll(async () => {
    await connection.close()
  })

  it('commits writes made to two collections', async () => {
    await connection.transaction(async (session) => {
      await connection
        .collection('transaction_probes')
        .insertOne({ name: 'probe' }, { session })
      await connection
        .collection('transaction_probe_entries')
        .insertOne({ name: 'entry' }, { session })
    })

    await expect(
      connection.collection('transaction_probes').countDocuments(),
    ).resolves.toBe(1)
    await expect(
      connection.collection('transaction_probe_entries').countDocuments(),
    ).resolves.toBe(1)
  })

  it('rolls back every write when the callback throws', async () => {
    await expect(
      connection.transaction(async (session) => {
        await connection
          .collection('transaction_probes')
          .insertOne({ name: 'probe' }, { session })
        await connection
          .collection('transaction_probe_entries')
          .insertOne({ name: 'entry' }, { session })
        throw new Error('rolled back on purpose')
      }),
    ).rejects.toThrow('rolled back on purpose')

    await expect(
      connection.collection('transaction_probes').countDocuments(),
    ).resolves.toBe(0)
    await expect(
      connection.collection('transaction_probe_entries').countDocuments(),
    ).resolves.toBe(0)
  })
})
