import { disconnect } from '../lib/google'
import { isAuthorized, json } from '../lib/request'

export const config = { path: '/api/disconnect' }

/** POST /api/disconnect, otsikko x-display-key: peruu Google-luvan ja poistaa tallennetun refresh tokenin. */
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  if (!isAuthorized(req.headers.get('x-display-key'), process.env.DISPLAY_ACCESS_KEY)) {
    return json({ error: 'unauthorized' }, 401)
  }
  try {
    await disconnect()
    return json({ ok: true })
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Tuntematon virhe')
    return json({ error: 'failed' }, 500)
  }
}
