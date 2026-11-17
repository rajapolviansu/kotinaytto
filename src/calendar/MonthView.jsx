import { getMonthGrid, getMonthTitle, WEEKDAY_LABELS } from './dateUtils'
import './MonthView.css'

function MonthView({ year, month }) {
  const weeks = getMonthGrid(year, month)

  return (
    <section className="month-view">
      <header className="month-header">
        <h1>{getMonthTitle(year, month)}</h1>
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
