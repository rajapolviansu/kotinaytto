import MonthView from './calendar/MonthView'
import './App.css'

function App() {
  const now = new Date()

  return <MonthView year={now.getFullYear()} month={now.getMonth()} />
}

export default App
