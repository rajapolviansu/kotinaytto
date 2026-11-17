import { useState } from 'react'
import MonthView from './calendar/MonthView'
import { getTodayInHelsinki, shiftMonth } from './calendar/dateUtils'
import { useToday } from './calendar/useToday'
import './App.css'

function getCurrentMonth() {
  const { year, month } = getTodayInHelsinki()
  return { year, month }
}

function App() {
  const [current, setCurrent] = useState(getCurrentMonth)
  const today = useToday()

  return (
    <MonthView
      year={current.year}
      month={current.month}
      today={today}
      onPrevious={() => setCurrent((c) => shiftMonth(c.year, c.month, -1))}
      onNext={() => setCurrent((c) => shiftMonth(c.year, c.month, 1))}
      onToday={() => setCurrent(getCurrentMonth())}
    />
  )
}

export default App
