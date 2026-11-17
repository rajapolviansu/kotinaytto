import { useCallback, useEffect, useRef, useState } from 'react'
import type { CalendarEvent } from '../events'
import { fetchGoogleEvents, HttpError } from './api'
import { AuthError, disconnect as disconnectAccount, getAccessToken, hasConnected } from './auth'

export type GoogleStatus =
  /** Client ID puuttuu: Google-yhteys ei ole käytössä. */
  | 'unavailable'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  /** Aiemmin yhdistetty tili tarvitsee uuden kirjautumisen. */
  | 'reauth'

const POLL_INTERVAL_MS = 60_000

/**
 * Hakee tapahtumat Google-kalenterista aikavälille [from, to) ja pollaa niitä minuutin välein.
 * Verkkovirheessä viimeksi haetut tapahtumat säilyvät ja stale on true.
 */
export function useGoogleCalendar(clientId: string | undefined, from: Date, to: Date) {
  const [status, setStatus] = useState<GoogleStatus>(() =>
    !clientId ? 'unavailable' : hasConnected() ? 'connecting' : 'disconnected',
  )
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [stale, setStale] = useState(false)
  const requestId = useRef(0)
  const fromMs = from.getTime()
  const toMs = to.getTime()

  const load = useCallback(async () => {
    if (!clientId) return
    const id = ++requestId.current
    const start = new Date(fromMs)
    const end = new Date(toMs)
    try {
      let token = await getAccessToken(clientId)
      let result: CalendarEvent[]
      try {
        result = await fetchGoogleEvents(token, start, end)
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 401)) throw error
        token = await getAccessToken(clientId, true) // Token mitätöity: pyydetään uusi
        result = await fetchGoogleEvents(token, start, end)
      }
      if (id !== requestId.current) return
      setEvents(result)
      setStale(false)
      setStatus('connected')
    } catch (error) {
      if (id !== requestId.current) return
      if (error instanceof AuthError || (error instanceof HttpError && error.status === 401)) {
        setStatus(hasConnected() ? 'reauth' : 'disconnected')
      } else {
        setStale(true) // Verkko- tai palvelinvirhe: näytetään viimeisin tieto
      }
    }
  }, [clientId, fromMs, toMs])

  // Pollaus on päällä vain yhdistettynä, jottei kirjautumisikkunaa yritetä avata taustalla
  const active = status === 'connecting' || status === 'connected'
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

  /** Käyttäjän painallus: käynnistää haun, joka avaa Googlen kirjautumisen tarvittaessa. */
  const connect = useCallback(() => setStatus('connecting'), [])

  const disconnect = useCallback(() => {
    requestId.current++
    setEvents([])
    setStale(false)
    setStatus('disconnected')
    void disconnectAccount()
  }, [])

  return { status, events, stale, connect, disconnect }
}
