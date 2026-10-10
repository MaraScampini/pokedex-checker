import type { H3Event } from 'h3'

const COOKIE = 'bd_session'
const enc = new TextEncoder()

// The session token is an HMAC of a fixed string keyed by the shared password,
// so changing APP_PASSWORD signs everyone out.
async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function password(event: H3Event) {
  const p = cfEnv(event).APP_PASSWORD
  if (!p) throw createError({ statusCode: 500, message: 'APP_PASSWORD is not set' })
  return p
}

const token = (event: H3Event) => hmac(password(event), 'binder-dex-session-v1')

export async function checkPassword(event: H3Event, attempt: string) {
  const p = password(event)
  // Compare HMACs so the comparison doesn't depend on where the strings differ.
  return (await hmac(p, attempt)) === (await hmac(p, p))
}

export async function isSignedIn(event: H3Event) {
  const c = getCookie(event, COOKIE)
  return !!c && c === (await token(event))
}

export async function startSession(event: H3Event) {
  setCookie(event, COOKIE, await token(event), {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })
}

export function endSession(event: H3Event) {
  deleteCookie(event, COOKIE, { path: '/' })
}
