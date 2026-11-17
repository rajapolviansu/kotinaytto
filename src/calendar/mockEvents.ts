import { helsinkiTimeToDate, type MonthRef } from './dateUtils'
import type { CalendarEvent, EventCalendar } from './events'

// Mock-data kehitystä varten. Korvataan Google-integraatiolla (V1.5).
const CALENDARS = {
  family: { id: 'family', name: 'Perhe', color: '#2f9e6b' },
  mom: { id: 'mom', name: 'Äiti', color: '#d9534f' },
  dad: { id: 'dad', name: 'Isä', color: '#e0a31f' },
  kids: { id: 'kids', name: 'Lapset', color: '#a064e0' },
} satisfies Record<string, EventCalendar>

/** Luo esimerkkitapahtumat annetulle kuukaudelle, jotta ne näkyvät mitä kuukautta tahansa selatessa. */
export function createMockEvents({ year, month }: MonthRef): CalendarEvent[] {
  let n = 0
  const timed = (
    title: string,
    calendar: EventCalendar,
    day: number,
    [h1, m1]: [number, number],
    [h2, m2]: [number, number],
  ): CalendarEvent => ({
    id: `mock-${year}-${month}-${n++}`,
    title,
    start: helsinkiTimeToDate(year, month, day, h1, m1),
    end: helsinkiTimeToDate(year, month, day, h2, m2),
    allDay: false,
    calendar,
  })
  const allDay = (title: string, calendar: EventCalendar, day: number, days = 1): CalendarEvent => ({
    id: `mock-${year}-${month}-${n++}`,
    title,
    start: helsinkiTimeToDate(year, month, day),
    end: helsinkiTimeToDate(year, month, day + days),
    allDay: true,
    calendar,
  })

  const { family, mom, dad, kids } = CALENDARS
  return [
    timed('Hammaslääkäri', mom, 3, [9, 30], [10, 15]),
    timed('Jalkapallotreenit', kids, 3, [17, 0], [18, 30]),
    timed('Palaveri', dad, 5, [13, 0], [14, 0]),
    allDay('Mummon syntymäpäivä', family, 8),
    timed('Kitaratunti', kids, 9, [16, 0], [16, 45]),
    timed('Vanhempainilta', family, 12, [18, 0], [19, 30]),
    allDay('Mökkireissu', family, 14, 3),
    timed('Kampaaja', mom, 14, [11, 0], [12, 0]),
    timed('Lääkäri', dad, 17, [8, 0], [8, 30]),
    timed('Uimakoulu', kids, 17, [17, 30], [18, 15]),
    timed('Ruokaostokset', family, 17, [18, 30], [19, 0]),
    timed('Sählyvuoro', dad, 17, [20, 0], [21, 0]),
    allDay('Isän työmatka', dad, 21, 2),
    timed('Koulun kevätjuhla', kids, 24, [10, 0], [11, 30]),
    timed('Illallinen ystävien kanssa', family, 27, [18, 0], [22, 0]),
    timed('Yöpyminen kaverilla', kids, 28, [18, 0], [23, 59]),
  ]
}
