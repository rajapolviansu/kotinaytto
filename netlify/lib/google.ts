import { getStore } from '@netlify/blobs'

// Googlen OAuth-kulku palvelimella: refresh token säilyy Netlify Blobsissa, ja
// client secret on vain ympäristömuuttujissa. Tokeneita ei koskaan lähetetä selaimelle.

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
export const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

const REFRESH_TOKEN_KEY = 'google-refresh-token'
const EXPIRY_MARGIN_MS = 60_000

/** Ympäristömuuttuja puuttuu. */
export class ConfigError extends Error {}
/** Googlea ei ole yhdistetty, tai tallennettu lupa on peruttu tai vanhentunut. */
export class NotConnectedError extends Error {}

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new ConfigError(`Ympäristömuuttuja ${name} puuttuu`)
  return value
}

const store = () => getStore('kotinaytto')

let cached: { token: string; expiresAt: number } | undefined

export function clearAccessToken() {
  cached = undefined
}

function postForm(url: string, params: Record<string, string>) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
}

/** Osoite, jonne käyttäjä ohjataan antamaan lupa. access_type=offline antaa refresh tokenin. */
export function buildAuthUrl(redirectUri: string, state: string): string {
  const url = new URL(AUTH_URL)
  url.search = new URLSearchParams({
    client_id: env('GOOGLE_CLIENT_ID'),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    // consent pakottaa uuden refresh tokenin, vaikka lupa olisi annettu aiemmin
    prompt: 'consent',
    state,
  }).toString()
  return url.toString()
}

/** Vaihtaa Googlen palauttaman koodin tokeneiksi ja tallentaa refresh tokenin. */
export async function connectWithCode(code: string, redirectUri: string): Promise<void> {
  const response = await postForm(TOKEN_URL, {
    code,
    client_id: env('GOOGLE_CLIENT_ID'),
    client_secret: env('GOOGLE_CLIENT_SECRET'),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  if (!response.ok) throw new Error(`Koodin vaihto epäonnistui: HTTP ${response.status}`)
  const data = (await response.json()) as { refresh_token?: string; access_token?: string; expires_in?: number }
  if (!data.refresh_token) throw new Error('Google ei palauttanut refresh tokenia')
  await store().set(REFRESH_TOKEN_KEY, data.refresh_token)
  cached = data.access_token
    ? { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 }
    : undefined
}

/** Palauttaa voimassa olevan access tokenin ja uusii sen refresh tokenilla tarvittaessa. */
export async function getAccessToken(): Promise<string> {
  if (cached && cached.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return cached.token

  const refreshToken = await store().get(REFRESH_TOKEN_KEY, { type: 'text' })
  if (!refreshToken) throw new NotConnectedError()

  const response = await postForm(TOKEN_URL, {
    client_id: env('GOOGLE_CLIENT_ID'),
    client_secret: env('GOOGLE_CLIENT_SECRET'),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    if (body.error === 'invalid_grant') {
      cached = undefined
      throw new NotConnectedError() // Lupa peruttu tai vanhentunut: yhdistettävä uudelleen
    }
    throw new Error(`Tokenin uusinta epäonnistui: HTTP ${response.status}`)
  }
  const data = (await response.json()) as { access_token: string; expires_in?: number }
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return cached.token
}

/** Peruu luvan Googlella (parhaan yrityksen varassa) ja poistaa tallennetun refresh tokenin. */
export async function disconnect(): Promise<void> {
  const refreshToken = await store().get(REFRESH_TOKEN_KEY, { type: 'text' })
  cached = undefined
  await store().delete(REFRESH_TOKEN_KEY)
  if (!refreshToken) return
  try {
    await postForm(REVOKE_URL, { token: refreshToken })
  } catch {
    // Paikallinen tila on jo tyhjennetty
  }
}
