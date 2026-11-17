import { getTodayInHelsinki, type DayRef } from './dateUtils'

/** Kalenteri, johon tapahtuma kuuluu (esim. perheenjäsenen kalenteri). */
export interface EventCalendar {
  id: string
  name: string
  /** CSS-väri, esim. "#e5534b". */
  color: string
}

/**
 * Kalenteritapahtuma. Muoto vastaa Google Calendarin tapahtumaa, jotta
 * integraation voi liittää myöhemmin muuntamalla vain datan.
 *
 * - Aikatapahtuma: start ja end ovat ajanhetkiä, end on päättymishetki.
 * - Koko päivän tapahtuma (allDay): start on ensimmäisen päivän alku Suomen ajassa ja
 *   end on viimeisen päivän JÄLKEISEN päivän alku (end on poissulkeva, kuten Googlessa).
 */
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  calendar: EventCalendar
}

/** Vertailtava avain päivälle (month 0-pohjainen). */
export function dayKey({ year, month, day }: DayRef): number {
  return year * 10000 + month * 100 + day
}

/** Tapahtuman ensimmäinen ja viimeinen päivä Suomen ajassa. */
export function getEventDayRange(event: CalendarEvent): { first: number; last: number } {
  const first = dayKey(getTodayInHelsinki(event.start))
  // Päättymishetki on poissulkeva: keskiyöhön päättyvä tapahtuma ei kuulu seuraavalle päivälle
  const lastInstant = new Date(Math.max(event.end.getTime() - 1, event.start.getTime()))
  const last = dayKey(getTodayInHelsinki(lastInstant))
  return { first, last: Math.max(first, last) }
}

/** Palauttaa päivälle osuvat tapahtumat: koko päivän ensin, sitten alkuajan mukaan. */
export function getEventsForDay(events: readonly CalendarEvent[], day: DayRef): CalendarEvent[] {
  const key = dayKey(day)
  return events
    .filter((event) => {
      const { first, last } = getEventDayRange(event)
      return first <= key && key <= last
    })
    .sort(
      (a, b) =>
        Number(b.allDay) - Number(a.allDay) ||
        a.start.getTime() - b.start.getTime() ||
        a.title.localeCompare(b.title, 'fi'),
    )
}
