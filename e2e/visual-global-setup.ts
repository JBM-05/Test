import { preview } from 'vite'

export default async function startVisualServer() {
  const server = await preview({
    logLevel: 'silent',
    preview: {
      host: '127.0.0.1',
      port: 4175,
      strictPort: true,
    },
  })

  return async () => {
    await server.close()
  }
}
