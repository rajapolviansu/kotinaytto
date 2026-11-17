import { createHash, timingSafeEqual } from 'node:crypto'

const MAX_RANGE_MS = 100 * 24 * 60 * 60 * 1000

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

/** Vertaa näyttöavainta vakioaikaisesti. Puuttuva avain ei koskaan kelpaa. */
export function isAuthorized(provided: string | null | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false
  return timingSafeEqual(digest(provided), digest(expected))
}

/** Lukee aikavälin [from, to) kyselyparametreista. Palauttaa null, jos se on virheellinen tai liian pitkä. */
export function parseRange(params: URLSearchParams): { from: Date; to: Date } | null {
  const from = new Date(params.get('from') ?? '')
  const to = new Date(params.get('to') ?? '')
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null
  if (to <= from || to.getTime() - from.getTime() > MAX_RANGE_MS) return null
  return { from, to }
}

export function getCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return undefined
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export function text(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
