import { useCallback, useEffect, useRef, useState } from 'react'
import type { CalendarEvent } from '../events'
import { loadDisplayKey, storeKey } from './displayKey'

export type GoogleStatus =
  /** Backend ei ole käytettävissä (esim. paikallinen `npm run dev`): näytetään mock-data. */
  | 'unavailable'
  /** Näyttöavainta ei ole vielä annettu. */
  | 'needs-key'
  /** Backend hylkäsi näyttöavaimen. */
  | 'unauthorized'
  /** Backend toimii, mutta Google-tiliä ei ole yhdistetty (tai lupa on peruttu). */
  | 'not-connected'
  | 'loading'
  | 'connected'

interface ApiEvent extends Omit<CalendarEvent, 'start' | 'end'> {
  start: string
  end: string
}

const POLL_INTERVAL_MS = 60_000

/**
 * Hakee tapahtumat omalta backendiltä (/api/events) aikavälille [from, to) ja pollaa niitä
 * minuutin välein. Verkkovirheessä viimeksi haetut tapahtumat säilyvät ja stale on true.
 */
export function useGoogleCalendar(from: Date, to: Date) {
  const [displayKey, setDisplayKey] = useState(loadDisplayKey)
  const [status, setStatus] = useState<GoogleStatus>(() => (displayKey ? 'loading' : 'needs-key'))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [stale, setStale] = useState(false)
  const requestId = useRef(0)
  const fromMs = from.getTime()
  const toMs = to.getTime()

  const load = useCallback(async () => {
    if (!displayKey) return
    const id = ++requestId.current
    const params = new URLSearchParams({
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
    })
    try {
      const response = await fetch(`/api/events?${params}`, {
        headers: { 'x-display-key': displayKey },
        cache: 'no-store',
      })
      if (id !== requestId.current) return
      const isJson = (response.headers.get('content-type') ?? '').includes('application/json')
      if (response.status === 404 || !isJson) setStatus('unavailable')
      else if (response.status === 401) setStatus('unauthorized')
      else if (response.status === 409) setStatus('not-connected')
      else if (!response.ok) setStale(true)
      else {
        const data = (await response.json()) as { events: ApiEvent[] }
        if (id !== requestId.current) return
        setEvents(data.events.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })))
        setStale(false)
        setStatus('connected')
      }
    } catch {
      if (id === requestId.current) setStale(true) // Verkko poikki: näytetään viimeisin tieto
    }
  }, [displayKey, fromMs, toMs])

  // Pollaus vain, kun haku voi onnistua; virhetiloissa odotetaan käyttäjän toimea
  const active = status === 'loading' || status === 'connected'
  useEffect(() => {
    if (!active) return
    // Ensimmäinen haku ajastimella, jotta tilaa ei päivitetä synkronisesti effectin sisällä
    const first = setTimeout(() => void load(), 0)
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active, load])

  const saveKey = useCallback((key: string) => {
    const trimmed = key.trim()
    if (!trimmed) return
    storeKey(trimmed)
    setDisplayKey(trimmed)
    setStatus('loading')
  }, [])

  /** Ohjaa Googlen lupanäkymään; paluun jälkeen sivu latautuu uudelleen. */
  const connect = useCallback(() => {
    if (displayKey) window.location.assign(`/api/auth/start?key=${encodeURIComponent(displayKey)}`)
  }, [displayKey])

  const disconnect = useCallback(async () => {
    if (!displayKey) return
    requestId.current++
    try {
      const response = await fetch('/api/disconnect', { method: 'POST', headers: { 'x-display-key': displayKey } })
      if (!response.ok) return
    } catch {
      return
    }
    setEvents([])
    setStale(false)
    setStatus('not-connected')
  }, [displayKey])

  return { status, events, stale, saveKey, connect, disconnect }
}
