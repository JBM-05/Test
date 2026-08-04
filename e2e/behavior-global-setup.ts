import type { AddressInfo } from 'node:net'

import { createServer } from 'vite'

export default async function startBehaviorServer() {
  const server = await createServer({
    logLevel: 'silent',
    server: {
      host: '127.0.0.1',
      port: 0,
    },
  })

  await server.listen()
  const address = server.httpServer?.address() as AddressInfo | null
  if (!address) {
    await server.close()
    throw new Error('Vite behavior server did not expose a listening address')
  }
  process.env.BEHAVIOR_BASE_URL = `http://127.0.0.1:${address.port}`

  return async () => {
    await server.close()
  }
}
