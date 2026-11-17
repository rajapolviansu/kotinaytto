import { describe, expect, it } from 'vitest'
import { getCookie, isAuthorized, parseRange } from './request'

describe('isAuthorized', () => {
  it('hyväksyy vain täsmälleen oikean avaimen', () => {
    expect(isAuthorized('salainen', 'salainen')).toBe(true)
    expect(isAuthorized('vaara', 'salainen')).toBe(false)
    expect(isAuthorized('salainen ', 'salainen')).toBe(false)
  })

  it('hylkää puuttuvan avaimen, myös kun palvelimen avain puuttuu', () => {
    expect(isAuthorized(null, 'salainen')).toBe(false)
    expect(isAuthorized('', 'salainen')).toBe(false)
    expect(isAuthorized('salainen', undefined)).toBe(false)
    expect(isAuthorized('', '')).toBe(false)
  })
})

describe('parseRange', () => {
  const params = (from: string, to: string) => new URLSearchParams({ from, to })

  it('lukee kelvollisen aikavälin', () => {
    const range = parseRange(params('2026-10-26T00:00:00Z', '2026-12-07T00:00:00Z'))
    expect(range?.from.toISOString()).toBe('2026-10-26T00:00:00.000Z')
    expect(range?.to.toISOString()).toBe('2026-12-07T00:00:00.000Z')
  })

  it('hylkää virheelliset, väärin päin olevat ja liian pitkät välit', () => {
    expect(parseRange(params('huono', '2026-12-07T00:00:00Z'))).toBeNull()
    expect(parseRange(new URLSearchParams())).toBeNull()
    expect(parseRange(params('2026-12-07T00:00:00Z', '2026-10-26T00:00:00Z'))).toBeNull()
    expect(parseRange(params('2026-01-01T00:00:00Z', '2027-01-01T00:00:00Z'))).toBeNull()
  })
})

describe('getCookie', () => {
  it('palauttaa nimetyn evästeen arvon', () => {
    const req = new Request('https://example.com', { headers: { cookie: 'a=1; oauth_state=abc=; b=2' } })
    expect(getCookie(req, 'oauth_state')).toBe('abc=')
    expect(getCookie(req, 'puuttuu')).toBeUndefined()
  })
})
