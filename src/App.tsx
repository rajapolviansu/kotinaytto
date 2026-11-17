import { useState } from 'react'
import MonthView from './calendar/MonthView'
import { shiftMonth } from './calendar/dateUtils'
import './App.css'

function getCurrentMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

function App() {
  const [current, setCurrent] = useState(getCurrentMonth)

  return (
    <MonthView
      year={current.year}
      month={current.month}
      onPrevious={() => setCurrent((c) => shiftMonth(c.year, c.month, -1))}
      onNext={() => setCurrent((c) => shiftMonth(c.year, c.month, 1))}
      onToday={() => setCurrent(getCurrentMonth())}
    />
  )
}

export default App
