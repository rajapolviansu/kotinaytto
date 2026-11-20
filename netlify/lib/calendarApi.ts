import { helsinkiTimeToDate } from '../../src/calendar/dateUtils'
import type { CalendarEvent, EventCalendar } from '../../src/calendar/events'

const API = 'https://www.googleapis.com/calendar/v3'
const TASKS_API = 'https://tasks.googleapis.com/tasks/v1'
const TASKS_COLOR = '#8e6bd8'
const FALLBACK_COLOR = '#4f8ef7'

export class HttpError extends Error {
  readonly status: number
  /** Googlen virheen syy (esim. ACCESS_TOKEN_SCOPE_INSUFFICIENT), jos saatavilla. */
  readonly reason?: string
  constructor(status: number, reason?: string) {
    super(`Google API: HTTP ${status}${reason ? ` (${reason})` : ''}`)
    this.status = status
    this.reason = reason
  }

  /** Tallennettu lupa ei kata tarvittavia oikeuksia: tili on yhdistettävä uudelleen. */
  get isInsufficientScope(): boolean {
    return this.status === 403 && this.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT'
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

export interface GoogleTask {
  id: string
  title?: string
  status?: string
  /** RFC 3339; Tasks käyttää vain päivämääräosaa (kellonaika on aina 00:00 UTC). */
  due?: string
  deleted?: boolean
}

/** Muuntaa Google-tehtävän koko päivän tapahtumaksi eräpäivälleen. Ilman eräpäivää ei voi sijoittaa kalenteriin. */
export function mapGoogleTask(item: GoogleTask, calendar: EventCalendar): CalendarEvent | null {
  if (item.deleted) return null
  const start = parseDateOnly(item.due?.slice(0, 10))
  if (!start) return null
  const [y, m, d] = (item.due as string).slice(0, 10).split('-').map(Number)
  return {
    id: `${calendar.id}:${item.id}`,
    title: item.title?.trim() || '(Ei otsikkoa)',
    start,
    end: helsinkiTimeToDate(y, m - 1, d + 1),
    allDay: true,
    calendar,
    task: true,
    done: item.status === 'completed',
  }
}

async function getJson<T>(url: URL, token: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { details?: { reason?: string }[]; errors?: { reason?: string }[] }
    }
    const reason = body.error?.details?.find((d) => d.reason)?.reason ?? body.error?.errors?.[0]?.reason
    throw new HttpError(response.status, reason)
  }
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
  const [lists, tasks] = await Promise.all([
    Promise.all(calendars.map((calendar) => fetchCalendarEvents(token, calendar, from, to, signal))),
    fetchTaskEvents(token, signal),
  ])
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const tasksInRange = tasks.filter((task) => task.start.getTime() < toMs && task.end.getTime() > fromMs)
  return [...lists.flat(), ...tasksInRange]
}

async function fetchTaskEvents(token: string, signal?: AbortSignal): Promise<CalendarEvent[]> {
  const listsUrl = new URL(`${TASKS_API}/users/@me/lists`)
  listsUrl.searchParams.set('maxResults', '100')
  const lists = await getJson<{ items?: { id: string; title?: string }[] }>(listsUrl, token, signal)
  const perList = await Promise.all(
    (lists.items ?? []).map(async (list) => {
      const calendar: EventCalendar = { id: `tasks-${list.id}`, name: list.title ?? 'Tehtävät', color: TASKS_COLOR }
      const events: CalendarEvent[] = []
      let pageToken: string | undefined
      do {
        const url = new URL(`${TASKS_API}/lists/${encodeURIComponent(list.id)}/tasks`)
        url.searchParams.set('maxResults', '100')
        url.searchParams.set('showCompleted', 'true')
        url.searchParams.set('showHidden', 'true')
        if (pageToken) url.searchParams.set('pageToken', pageToken)
        const data = await getJson<{ items?: GoogleTask[]; nextPageToken?: string }>(url, token, signal)
        for (const item of data.items ?? []) {
          const event = mapGoogleTask(item, calendar)
          if (event) events.push(event)
        }
        pageToken = data.nextPageToken
      } while (pageToken)
      return events
    }),
  )
  return perList.flat()
}
