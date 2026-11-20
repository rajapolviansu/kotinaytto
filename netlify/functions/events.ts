import { HttpError, fetchGoogleEvents } from '../lib/calendarApi'
import { NotConnectedError, clearAccessToken, getAccessToken } from '../lib/google'
import { isAuthorized, json, parseRange } from '../lib/request'

export const config = { path: '/api/events' }

/** GET /api/events?from=<ISO>&to=<ISO>, otsikko x-display-key. Palauttaa {events} tai {error}. */
export default async (req: Request): Promise<Response> => {
  const expectedKey = process.env.DISPLAY_ACCESS_KEY
  if (!expectedKey) return json({ error: 'not_configured' }, 500)
  if (!isAuthorized(req.headers.get('x-display-key'), expectedKey)) return json({ error: 'unauthorized' }, 401)

  const range = parseRange(new URL(req.url).searchParams)
  if (!range) return json({ error: 'bad_range' }, 400)

  try {
    const events = await fetchGoogleEvents(await getAccessToken(), range.from, range.to)
    return json({ events }) // Date-oliot muuttuvat ISO-merkkijonoiksi
  } catch (error) {
    if (error instanceof NotConnectedError) return json({ error: 'not_connected' }, 409)
    // Vanha lupa ei sisällä Tasks-oikeutta: näytetään "Yhdistä"-painike uudelleenyhdistämistä varten
    if (error instanceof HttpError && error.isInsufficientScope) return json({ error: 'not_connected' }, 409)
    if (error instanceof HttpError && error.status === 401) clearAccessToken() // Seuraava haku uusii tokenin
    console.error(error instanceof Error ? error.message : 'Tuntematon virhe')
    return json({ error: 'upstream_error' }, 502)
  }
}
