import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { formatTimeInHelsinki, getMonthGrid, getMonthTitle, WEEKDAY_LABELS, type DayRef } from './dateUtils'
import { getEventsForDay, type CalendarEvent } from './events'
import './MonthView.css'

interface MonthViewProps {
  year: number
  month: number
  today: DayRef
  events?: readonly CalendarEvent[]
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}

/** Päivän tapahtumat: näyttää vain kokonaan mahtuvat rivit, loput "+N muuta" -rivillä. */
function DayEvents({ events }: { events: CalendarEvent[] }) {
  const listRef = useRef<HTMLUListElement>(null)
  const rowHeight = useRef(0)
  const [capacity, setCapacity] = useState(Infinity)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const update = () => {
      const row = list.querySelector<HTMLElement>('.event')
      if (row) rowHeight.current = row.offsetHeight
      if (!rowHeight.current) return
      const gap = parseFloat(getComputedStyle(list).rowGap) || 0
      setCapacity(Math.max(0, Math.floor((list.clientHeight + gap) / (rowHeight.current + gap))))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(list)
    return () => observer.disconnect()
  }, [events.length])

  if (events.length === 0) return null

  // "+N muuta" -rivi vie yhden rivin tilan
  const fits = events.length <= capacity
  const visible = fits ? events : events.slice(0, Math.max(0, capacity - 2))
  const hidden = events.length - visible.length

  return (
    <ul className="day-events" ref={listRef}>
      {visible.map((event) => (
        <li
          key={event.id}
          className={event.allDay ? 'event event-allday' : 'event'}
          style={{ '--event-color': event.calendar.color } as CSSProperties}
          title={`${event.title} (${event.calendar.name})`}
        >
          {!event.allDay && <span className="event-time">{formatTimeInHelsinki(event.start)}</span>}
          <span className="event-title">{event.title}</span>
        </li>
      ))}
      {hidden > 0 && <li className="event-more">+{hidden} muuta</li>}
    </ul>
  )
}

function MonthView({ year, month, today, events = [], onPrevious, onNext, onToday }: MonthViewProps) {
  const weeks = getMonthGrid(year, month)
  const title = getMonthTitle(year, month)

  return (
    <section className="month-view" aria-label={`Kalenteri, ${title}`}>
      <header className="month-header">
        <h1 aria-live="polite">{title}</h1>
        <nav className="month-nav" aria-label="Kuukauden selaus">
          <button type="button" onClick={onPrevious} aria-label="Edellinen kuukausi">
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="month-today" onClick={onToday} aria-label="Siirry kuluvaan kuukauteen">
            Tänään
          </button>
          <button type="button" onClick={onNext} aria-label="Seuraava kuukausi">
            <span aria-hidden="true">›</span>
          </button>
        </nav>
      </header>

      <div className="month-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="month-grid" style={{ '--weeks': weeks.length } as CSSProperties}>
        {weeks.flat().map((cell) => {
          const isToday =
            cell.year === today.year && cell.month === today.month && cell.day === today.day
          const className = ['day', cell.inMonth ? '' : 'day-outside', isToday ? 'day-today' : '']
            .filter(Boolean)
            .join(' ')
          return (
            <div
              key={`${cell.year}-${cell.month}-${cell.day}`}
              className={className}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className="day-number">{cell.day}</span>
              <DayEvents events={getEventsForDay(events, cell)} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default MonthView
