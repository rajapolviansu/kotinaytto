import { describe, expect, it } from 'vitest'
import { mapGoogleEvent, mapGoogleTask } from './calendarApi'
import { getEventsForDay } from '../../src/calendar/events'

const calendar = { id: 'cal', name: 'Perhe', color: '#2f9e6b' }

describe('mapGoogleEvent', () => {
  it('muuntaa aikatapahtuman', () => {
    const event = mapGoogleEvent(
      {
        id: 'a1',
        summary: 'Palaveri',
        start: { dateTime: '2026-11-17T13:00:00+02:00' },
        end: { dateTime: '2026-11-17T14:00:00+02:00' },
      },
      calendar,
    )
    expect(event).toMatchObject({ id: 'cal:a1', title: 'Palaveri', allDay: false, calendar })
    expect(event?.start.toISOString()).toBe('2026-11-17T11:00:00.000Z')
    expect(event?.end.toISOString()).toBe('2026-11-17T12:00:00.000Z')
  })

  it('muuntaa koko päivän tapahtuman Suomen ajan keskiyöksi ja säilyttää poissulkevan lopun', () => {
    const event = mapGoogleEvent(
      { id: 'b1', summary: 'Mökki', start: { date: '2026-07-14' }, end: { date: '2026-07-17' } },
      calendar,
    )
    expect(event?.allDay).toBe(true)
    // Kesäaika: Suomen keskiyö on 21:00 UTC edellisenä päivänä
    expect(event?.start.toISOString()).toBe('2026-07-13T21:00:00.000Z')
    const days = [14, 15, 16, 17].map(
      (day) => getEventsForDay(event ? [event] : [], { year: 2026, month: 6, day }).length,
    )
    expect(days).toEqual([1, 1, 1, 0])
  })

  it('käyttää oletusotsikkoa, kun otsikko puuttuu', () => {
    const event = mapGoogleEvent(
      { id: 'c1', start: { date: '2026-11-17' }, end: { date: '2026-11-18' } },
      calendar,
    )
    expect(event?.title).toBe('(Ei otsikkoa)')
  })

  it('ohittaa perutut ja vajaat tapahtumat', () => {
    const time = { dateTime: '2026-11-17T13:00:00+02:00' }
    expect(mapGoogleEvent({ id: 'd', status: 'cancelled', start: time, end: time }, calendar)).toBeNull()
    expect(mapGoogleEvent({ id: 'e', start: time }, calendar)).toBeNull()
    expect(mapGoogleEvent({ id: 'f', start: { date: 'huono' }, end: { date: 'huono' } }, calendar)).toBeNull()
  })
})

describe('mapGoogleTask', () => {
  it('sijoittaa tehtävän eräpäivälle koko päivän tapahtumana', () => {
    const event = mapGoogleTask(
      { id: 't1', title: 'Osta maitoa', due: '2026-11-17T00:00:00.000Z', status: 'needsAction' },
      calendar,
    )
    expect(event).toMatchObject({ id: 'cal:t1', title: 'Osta maitoa', allDay: true, task: true, done: false })
    const days = [16, 17, 18].map(
      (day) => getEventsForDay(event ? [event] : [], { year: 2026, month: 10, day }).length,
    )
    expect(days).toEqual([0, 1, 0])
  })

  it('merkitsee suoritetun ja ohittaa eräpäivättömän tai poistetun', () => {
    expect(mapGoogleTask({ id: 't2', due: '2026-11-17T00:00:00.000Z', status: 'completed' }, calendar)?.done).toBe(true)
    expect(mapGoogleTask({ id: 't3', title: 'x' }, calendar)).toBeNull()
    expect(mapGoogleTask({ id: 't4', due: '2026-11-17T00:00:00.000Z', deleted: true }, calendar)).toBeNull()
  })
})
