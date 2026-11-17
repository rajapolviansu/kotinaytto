import { getMonthGrid, getMonthTitle, WEEKDAY_LABELS } from './dateUtils'
import './MonthView.css'

function MonthView({ year, month, onPrevious, onNext, onToday }) {
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

      <div className="month-grid" style={{ '--weeks': weeks.length }}>
        {weeks.flat().map((cell) => (
          <div
            key={`${cell.year}-${cell.month}-${cell.day}`}
            className={cell.inMonth ? 'day' : 'day day-outside'}
          >
            <span className="day-number">{cell.day}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default MonthView
