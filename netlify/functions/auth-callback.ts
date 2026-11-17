import { connectWithCode } from '../lib/google'
import { getCookie, text } from '../lib/request'

export const config = { path: '/api/auth/callback' }

/** Googlen paluuosoite: vaihtaa koodin tokeneiksi ja ohjaa takaisin sovellukseen. */
export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const expectedState = getCookie(req, 'oauth_state')
  const state = url.searchParams.get('state')
  const code = url.searchParams.get('code')

  if (url.searchParams.get('error')) return text('Googlen kirjautuminen keskeytettiin tai evättiin.', 400)
  if (!expectedState || !state || state !== expectedState || !code) {
    return text('Virheellinen kirjautumispyyntö. Aloita yhdistäminen sovelluksesta uudelleen.', 400)
  }

  try {
    await connectWithCode(code, `${url.origin}/api/auth/callback`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Tuntematon virhe')
    return text('Yhdistäminen epäonnistui. Katso Netlifyn function-lokit.', 500)
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Cache-Control': 'no-store',
      'Set-Cookie': 'oauth_state=; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=0',
    },
  })
}
