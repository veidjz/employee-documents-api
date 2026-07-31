export type Environment = {
  PORT: number
  MONGO_URL: string
}

export function validateEnvironment(
  variables: Record<string, string | undefined>,
): Environment {
  const mongoUrl = variables.MONGO_URL ?? ''
  if (!/^mongodb(\+srv)?:\/\//.test(mongoUrl)) {
    throw new Error('MONGO_URL must be a mongodb connection string')
  }

  const port = Number(variables.PORT ?? 3000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535')
  }

  return { PORT: port, MONGO_URL: mongoUrl }
}
