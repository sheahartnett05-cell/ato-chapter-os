/**
 * Apply Supabase SQL migrations via Postgres URL or Management API.
 *
 * .env.local options (any one):
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres
 *   SUPABASE_ACCESS_TOKEN=sbp_...  (Dashboard → Account → Access Tokens)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function loadEnvLocal() {
  if (!existsSync('.env.local')) return {}
  let text = readFileSync('.env.local', 'utf8')
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    env[key] = val
  }
  return env
}

function projectRefFromUrl(url) {
  const m = url?.match(/https:\/\/([^.]+)\.supabase\.co/)
  return m?.[1] ?? null
}

const env = { ...process.env, ...loadEnvLocal() }
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL || env.POSTGRES_URL
const accessToken = env.SUPABASE_ACCESS_TOKEN
const projectRef = env.SUPABASE_PROJECT_REF || projectRefFromUrl(env.VITE_SUPABASE_URL)

const filter = process.argv[2]
const migDir = join(process.cwd(), 'supabase', 'migrations')
const files = readdirSync(migDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

const toRun = filter && filter !== 'all'
  ? files.filter((f) => f.includes(filter))
  : files

if (toRun.length === 0) {
  console.error('No migration files matched')
  process.exit(1)
}

async function runViaPostgres(sql) {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
  } finally {
    await client.end().catch(() => {})
  }
}

async function runViaManagementApi(sql) {
  if (!accessToken || !projectRef) {
    throw new Error('SUPABASE_ACCESS_TOKEN and project ref required')
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.text()
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${body.slice(0, 400)}`)
  }
}

async function runSql(sql) {
  if (dbUrl) return runViaPostgres(sql)
  if (accessToken && projectRef) return runViaManagementApi(sql)
  throw new Error(`No migration credentials.
Add ONE of these to .env.local:
  SUPABASE_ACCESS_TOKEN=sbp_...   (Account → Access Tokens, needs Database write)
  SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres`)
}

console.log(`Applying ${toRun.length} migration(s)…`)
for (const file of toRun) {
  const sql = readFileSync(join(migDir, file), 'utf8')
  process.stdout.write(`  ${file} … `)
  try {
    await runSql(sql)
    console.log('ok')
  } catch (e) {
    console.log('FAILED')
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
}
console.log('Done.')
