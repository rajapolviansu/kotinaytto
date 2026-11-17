import { randomBytes } from 'node:crypto'
import { ConfigError, buildAuthUrl } from '../lib/google'
import { isAuthorized, text } from '../lib/request'

export const config = { path: '/api/auth/start' }

/** GET /api/auth/start?key=<näyttöavain>: ohjaa Googlen lupanäkymään. Vaatii avaimen, jottei kukaan muu voi yhdistää tiliä. */
export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  if (!isAuthorized(url.searchParams.get('key'), process.env.DISPLAY_ACCESS_KEY)) {
    return text('Ei oikeutta', 401)
  }

  const state = randomBytes(16).toString('hex')
  let location: string
  try {
    location = buildAuthUrl(`${url.origin}/api/auth/callback`, state)
  } catch (error) {
    if (error instanceof ConfigError) return text(error.message, 500)
    throw error
  }

  const secure = url.protocol === 'https:' ? '; Secure' : ''
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store',
      // state-eväste varmistaa, että callback liittyy tähän aloitukseen
      'Set-Cookie': `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=600${secure}`,
    },
  })
}
