import { spawn } from 'child_process'
import fs from 'fs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Path to the URI file (in dev/src/.tmp-db-uri)
const uriFile = path.resolve(dirname, 'src/.tmp-db-uri')
const lockFile = path.resolve(dirname, 'src/.mongo.lock')

async function start() {
  // Clean up previous locks/URIs
  if (fs.existsSync(uriFile)) fs.rmSync(uriFile)
  if (fs.existsSync(lockFile)) fs.rmSync(lockFile)

  console.log('⚡ Starting standalone MongoMemoryServer...')
  const mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'payload-media-gallery-dev',
    },
  })
  const uri = mongod.getUri()

  fs.writeFileSync(uriFile, uri)
  console.log(`✅ MongoDB started at ${uri}`)

  // Start Next.js
  console.log('🚀 Starting Next.js...')
  // We use 'pnpm exec next dev dev' to ensure we use the project's next binary
  const nextDev = spawn('pnpm', ['exec', 'next', 'dev', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  })

  // Cleanup on exit
  const cleanup = async (code: number | null) => {
    console.log('\n🛑 Stopping MongoDB...')
    if (fs.existsSync(uriFile)) {
      try {
        fs.unlinkSync(uriFile)
      } catch {}
    }
    await mongod.stop()
    if (typeof code === 'number') process.exit(code)
    else process.exit(0)
  }

  nextDev.on('exit', (code) => {
    console.log(`Next.js exited with code ${code}`)
    cleanup(code)
  })
  process.on('SIGINT', () => cleanup(0))
  process.on('SIGTERM', () => cleanup(0))
}

start().catch((err) => {
  console.error('Failed to start:', err)
  process.exit(1)
})
