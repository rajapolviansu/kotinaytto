import { useMemo, useState } from 'react'
import { createMockEvents } from './calendar/mockEvents'
import MonthView from './calendar/MonthView'
import { getMonthGrid, getTodayInHelsinki, helsinkiTimeToDate, shiftMonth } from './calendar/dateUtils'
import { useToday } from './calendar/useToday'
import GoogleStatus from './calendar/google/GoogleStatus'
import { useGoogleCalendar } from './calendar/google/useGoogleCalendar'
import './App.css'

// Ilman client ID:tä (esim. paikallinen kehitys) näytetään mock-data
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || undefined

function getCurrentMonth() {
  const { year, month } = getTodayInHelsinki()
  return { year, month }
}

/** Kuukausiruudukon näkyvä aikaväli [alku, loppu), täyttöpäivät mukana. */
function getVisibleRange(year: number, month: number): [Date, Date] {
  const days = getMonthGrid(year, month).flat()
  const first = days[0]
  const last = days[days.length - 1]
  return [
    helsinkiTimeToDate(first.year, first.month, first.day),
    helsinkiTimeToDate(last.year, last.month, last.day + 1),
  ]
}

function App() {
  const [current, setCurrent] = useState(getCurrentMonth)
  const today = useToday()
  const [from, to] = useMemo(() => getVisibleRange(current.year, current.month), [current])
  const google = useGoogleCalendar(GOOGLE_CLIENT_ID, from, to)
  const mockEvents = useMemo(() => createMockEvents(current), [current])

  return (
    <MonthView
      year={current.year}
      month={current.month}
      today={today}
      events={GOOGLE_CLIENT_ID ? google.events : mockEvents}
      headerExtra={
        <GoogleStatus
          status={google.status}
          stale={google.stale}
          onConnect={google.connect}
          onDisconnect={google.disconnect}
        />
      }
      onPrevious={() => setCurrent((c) => shiftMonth(c.year, c.month, -1))}
      onNext={() => setCurrent((c) => shiftMonth(c.year, c.month, 1))}
      onToday={() => setCurrent(getCurrentMonth())}
    />
  )
}

export default App
