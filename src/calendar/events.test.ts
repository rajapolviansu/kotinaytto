import { describe, expect, it } from 'vitest'
import { formatTimeInHelsinki, helsinkiTimeToDate } from './dateUtils'
import { getEventsForDay, type CalendarEvent } from './events'

const cal = { id: 'c', name: 'C', color: '#000' }
const ev = (id: string, start: Date, end: Date, allDay = false): CalendarEvent => ({
  id,
  title: id,
  start,
  end,
  allDay,
  calendar: cal,
})

describe('helsinkiTimeToDate', () => {
  it('huomioi talvi- ja kesäajan', () => {
    expect(helsinkiTimeToDate(2026, 0, 15, 12, 0).toISOString()).toBe('2026-01-15T10:00:00.000Z')
    expect(helsinkiTimeToDate(2026, 6, 15, 12, 0).toISOString()).toBe('2026-07-15T09:00:00.000Z')
  })
  it('formatTimeInHelsinki palauttaa saman kellonajan takaisin', () => {
    expect(formatTimeInHelsinki(helsinkiTimeToDate(2026, 6, 15, 9, 5))).toBe('9.05')
  })
})

describe('getEventsForDay', () => {
  const day = (d: number) => ({ year: 2026, month: 10, day: d })

  it('palauttaa vain päivälle osuvat tapahtumat', () => {
    const e = ev('a', helsinkiTimeToDate(2026, 10, 5, 10), helsinkiTimeToDate(2026, 10, 5, 11))
    expect(getEventsForDay([e], day(5))).toEqual([e])
    expect(getEventsForDay([e], day(6))).toEqual([])
  })
  it('usean päivän koko päivän tapahtuma näkyy jokaisena päivänä, ei end-päivänä', () => {
    const e = ev('b', helsinkiTimeToDate(2026, 10, 10), helsinkiTimeToDate(2026, 10, 13), true)
    expect(getEventsForDay([e], day(10))).toHaveLength(1)
    expect(getEventsForDay([e], day(12))).toHaveLength(1)
    expect(getEventsForDay([e], day(13))).toHaveLength(0)
  })
  it('keskiyöhön päättyvä tapahtuma ei vuoda seuraavalle päivälle', () => {
    const e = ev('c', helsinkiTimeToDate(2026, 10, 5, 22), helsinkiTimeToDate(2026, 10, 6, 0))
    expect(getEventsForDay([e], day(6))).toEqual([])
  })
  it('yön yli kestävä tapahtuma näkyy molempina päivinä', () => {
    const e = ev('d', helsinkiTimeToDate(2026, 10, 5, 22), helsinkiTimeToDate(2026, 10, 6, 1))
    expect(getEventsForDay([e], day(5))).toHaveLength(1)
    expect(getEventsForDay([e], day(6))).toHaveLength(1)
  })
  it('järjestää koko päivän tapahtumat ensin ja muut alkuajan mukaan', () => {
    const late = ev('late', helsinkiTimeToDate(2026, 10, 5, 15), helsinkiTimeToDate(2026, 10, 5, 16))
    const early = ev('early', helsinkiTimeToDate(2026, 10, 5, 8), helsinkiTimeToDate(2026, 10, 5, 9))
    const all = ev('all', helsinkiTimeToDate(2026, 10, 5), helsinkiTimeToDate(2026, 10, 6), true)
    expect(getEventsForDay([late, early, all], day(5)).map((e) => e.id)).toEqual([
      'all',
      'early',
      'late',
    ])
  })
})
