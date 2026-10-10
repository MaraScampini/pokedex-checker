import type { D1Database } from '@cloudflare/workers-types'
import type { H3Event } from 'h3'

interface Env {
  DB: D1Database
  APP_PASSWORD?: string
}

export function cfEnv(event: H3Event): Env {
  const env = event.context.cloudflare?.env as unknown as Env | undefined
  if (!env) throw createError({ statusCode: 500, message: 'Cloudflare bindings are not available' })
  return env
}

export function useDb(event: H3Event): D1Database {
  const db = cfEnv(event).DB
  if (!db) throw createError({ statusCode: 500, message: 'D1 binding "DB" is missing' })
  return db
}
