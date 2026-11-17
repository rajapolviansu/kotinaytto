// Google Identity Services (GIS) -token-malli selaimessa. Client secretiä ei tarvita.
// Access token on lyhytikäinen (~1 h) ja se uusitaan hiljaa ennen vanhenemista.

const GIS_SRC = 'https://accounts.google.com/gsi/client'
export const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

const TOKEN_KEY = 'kotinaytto.google-token'
const CONNECTED_KEY = 'kotinaytto.google-connected'
/** Uusitaan token, kun sen voimassaoloa on jäljellä alle tämä. */
const EXPIRY_MARGIN_MS = 60_000

interface StoredToken {
  accessToken: string
  expiresAt: number
}

interface TokenResponse {
  access_token?: string
  expires_in?: number | string
  error?: string
}

interface GoogleGlobal {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
        error_callback: (error: { type: string }) => void
      }): { requestAccessToken(options?: { prompt?: string }): void }
      revoke(token: string, done?: () => void): void
    }
  }
}

/** Kirjautuminen tai tokenin uusinta epäonnistui (käyttäjän pitää kirjautua uudelleen). */
export class AuthError extends Error {}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Tallennus ei ole käytössä (esim. yksityinen selaus): jatketaan ilman
  }
}

function readToken(): StoredToken | null {
  const raw = readStorage(TOKEN_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredToken>
    if (typeof parsed.accessToken === 'string' && typeof parsed.expiresAt === 'number') {
      return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt }
    }
  } catch {
    // Virheellinen arvo ohitetaan
  }
  return null
}

/** Onko tili yhdistetty aiemmin tällä laitteella (V1.6). */
export function hasConnected(): boolean {
  return readStorage(CONNECTED_KEY) === '1'
}

function getGoogle(): GoogleGlobal | undefined {
  const google = (window as unknown as { google?: GoogleGlobal }).google
  return google?.accounts?.oauth2 ? google : undefined
}

let gisPromise: Promise<GoogleGlobal> | undefined

function loadGis(): Promise<GoogleGlobal> {
  gisPromise ??= new Promise<GoogleGlobal>((resolve, reject) => {
    const existing = getGoogle()
    if (existing) {
      resolve(existing)
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => {
      const google = getGoogle()
      if (google) resolve(google)
      else reject(new Error('Google-kirjautumiskirjasto ei latautunut'))
    }
    script.onerror = () => reject(new Error('Google-kirjautumiskirjaston lataus epäonnistui'))
    document.head.append(script)
  }).catch((error: unknown) => {
    gisPromise = undefined // Yritetään uudelleen seuraavalla kerralla (esim. verkko palannut)
    throw error
  })
  return gisPromise
}

async function requestToken(clientId: string): Promise<StoredToken> {
  const google = await loadGis()
  return new Promise<StoredToken>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new AuthError(response.error ?? 'Tunnistetta ei saatu'))
          return
        }
        const seconds = Number(response.expires_in) || 3600
        resolve({ accessToken: response.access_token, expiresAt: Date.now() + seconds * 1000 })
      },
      error_callback: (error) => reject(new AuthError(error.type)),
    })
    // Tyhjä prompt: ei näytä mitään, jos käyttäjä on jo antanut luvan
    client.requestAccessToken({ prompt: '' })
  })
}

let inFlight: Promise<string> | undefined

/**
 * Palauttaa voimassa olevan access tokenin: tallennettu, jos se on vielä voimassa,
 * muuten pyytää uuden Googlelta. force ohittaa tallennetun tokenin.
 */
export function getAccessToken(clientId: string, force = false): Promise<string> {
  if (!force) {
    const stored = readToken()
    if (stored && stored.expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
      return Promise.resolve(stored.accessToken)
    }
  }
  inFlight ??= requestToken(clientId)
    .then((token) => {
      writeStorage(TOKEN_KEY, JSON.stringify(token))
      writeStorage(CONNECTED_KEY, '1')
      return token.accessToken
    })
    .finally(() => {
      inFlight = undefined
    })
  return inFlight
}

/** Katkaisee yhteyden: token perutaan ja tili unohdetaan tältä laitteelta. */
export async function disconnect(): Promise<void> {
  const token = readToken()
  writeStorage(TOKEN_KEY, null)
  writeStorage(CONNECTED_KEY, null)
  if (!token) return
  try {
    const google = await loadGis()
    google.accounts.oauth2.revoke(token.accessToken)
  } catch {
    // Peruutus on parhaan yrityksen varassa; paikallinen tila on jo tyhjennetty
  }
}
