import fs from 'node:fs'
import path from 'node:path'
import { Pool } from 'pg'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'platform-runtime.json')
const postgresKey = 'platform-runtime'

type StoreApi<T> = {
  read: () => Promise<T>
  write: (value: T) => Promise<void>
}

declare global {
  // eslint-disable-next-line no-var
  var __nexusPgPool__: Pool | undefined
}

function getPool() {
  if (!process.env.DATABASE_URL) return null
  if (!global.__nexusPgPool__) {
    global.__nexusPgPool__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    })
  }

  return global.__nexusPgPool__
}

async function getPostgresStore<T>(seedFactory: () => T): Promise<StoreApi<T> | null> {
  const pool = getPool()
  if (!pool) return null

  await pool.query(`
    CREATE TABLE IF NOT EXISTS nexus_platform_state (
      state_key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  return {
    read: async () => {
      const result = await pool.query('SELECT value FROM nexus_platform_state WHERE state_key = $1', [postgresKey])
      if (result.rowCount && result.rows[0]?.value) {
        return result.rows[0].value as T
      }

      const seeded = seedFactory()
      await pool.query(
        `
          INSERT INTO nexus_platform_state (state_key, value)
          VALUES ($1, $2::jsonb)
          ON CONFLICT (state_key) DO UPDATE
          SET value = EXCLUDED.value, updated_at = NOW()
        `,
        [postgresKey, JSON.stringify(seeded)],
      )
      return seeded
    },
    write: async (value: T) => {
      await pool.query(
        `
          INSERT INTO nexus_platform_state (state_key, value)
          VALUES ($1, $2::jsonb)
          ON CONFLICT (state_key) DO UPDATE
          SET value = EXCLUDED.value, updated_at = NOW()
        `,
        [postgresKey, JSON.stringify(value)],
      )
    },
  }
}

function getFileStore<T>(seedFactory: () => T): StoreApi<T> {
  return {
    read: () => {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(seedFactory(), null, 2))
      }
      return Promise.resolve(JSON.parse(fs.readFileSync(filePath, 'utf8')) as T)
    },
    write: (value: T) => {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
      return Promise.resolve()
    },
  }
}

export async function createStore<T>(seedFactory: () => T): Promise<StoreApi<T>> {
  const postgresStore = await getPostgresStore(seedFactory)
  return postgresStore ?? getFileStore(seedFactory)
}
