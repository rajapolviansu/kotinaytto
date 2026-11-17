import { helsinkiTimeToDate } from '../../src/calendar/dateUtils'
import type { CalendarEvent, EventCalendar } from '../../src/calendar/events'

const API = 'https://www.googleapis.com/calendar/v3'
const FALLBACK_COLOR = '#4f8ef7'

export class HttpError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`Google Calendar API: HTTP ${status}`)
    this.status = status
  }
}

interface GoogleCalendarListItem {
  id: string
  summary?: string
  summaryOverride?: string
  backgroundColor?: string
  selected?: boolean
}

interface GoogleEventTime {
  date?: string
  dateTime?: string
}

export interface GoogleEvent {
  id: string
  status?: string
  summary?: string
  start?: GoogleEventTime
  end?: GoogleEventTime
}

/** "2026-11-17" -> Suomen ajan keskiyö. */
function parseDateOnly(value: string | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  if (!match) return null
  return helsinkiTimeToDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Muuntaa Googlen tapahtuman sovelluksen malliksi. Palauttaa null, jos tapahtumaa ei voi näyttää. */
export function mapGoogleEvent(item: GoogleEvent, calendar: EventCalendar): CalendarEvent | null {
  if (item.status === 'cancelled' || !item.start || !item.end) return null
  const allDay = item.start.date !== undefined
  const start = allDay ? parseDateOnly(item.start.date) : new Date(item.start.dateTime ?? '')
  const end = allDay ? parseDateOnly(item.end.date) : new Date(item.end.dateTime ?? '')
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  return {
    id: `${calendar.id}:${item.id}`,
    title: item.summary?.trim() || '(Ei otsikkoa)',
    start,
    end,
    allDay,
    calendar,
  }
}

async function getJson<T>(url: URL, token: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal })
  if (!response.ok) throw new HttpError(response.status)
  return (await response.json()) as T
}

async function fetchCalendars(token: string, signal?: AbortSignal): Promise<EventCalendar[]> {
  const url = new URL(`${API}/users/me/calendarList`)
  url.searchParams.set('minAccessRole', 'reader')
  const data = await getJson<{ items?: GoogleCalendarListItem[] }>(url, token, signal)
  return (data.items ?? [])
    .filter((item) => item.selected !== false)
    .map((item) => ({
      id: item.id,
      name: item.summaryOverride ?? item.summary ?? item.id,
      color: item.backgroundColor ?? FALLBACK_COLOR,
    }))
}

async function fetchCalendarEvents(
  token: string,
  calendar: EventCalendar,
  from: Date,
  to: Date,
  signal?: AbortSignal,
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = []
  let pageToken: string | undefined
  do {
    const url = new URL(`${API}/calendars/${encodeURIComponent(calendar.id)}/events`)
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
    url.searchParams.set('maxResults', '250')
    url.searchParams.set('timeMin', from.toISOString())
    url.searchParams.set('timeMax', to.toISOString())
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const data = await getJson<{ items?: GoogleEvent[]; nextPageToken?: string }>(url, token, signal)
    for (const item of data.items ?? []) {
      const event = mapGoogleEvent(item, calendar)
      if (event) events.push(event)
    }
    pageToken = data.nextPageToken
  } while (pageToken)
  return events
}

/** Hakee kaikkien valittujen kalenterien tapahtumat aikavälille [from, to). */
export async function fetchGoogleEvents(
  token: string,
  from: Date,
  to: Date,
  signal?: AbortSignal,
): Promise<CalendarEvent[]> {
  const calendars = await fetchCalendars(token, signal)
  const lists = await Promise.all(
    calendars.map((calendar) => fetchCalendarEvents(token, calendar, from, to, signal)),
  )
  return lists.flat()
}
