import { useEffect, useState } from 'react'
import { getMsUntilHelsinkiMidnight, getTodayInHelsinki, type DayRef } from './dateUtils'

const MAX_DELAY_MS = 60 * 60 * 1000

function isSameDay(a: DayRef, b: DayRef): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

/**
 * Kuluva päivä Suomen aikavyöhykkeellä. Päivittyy keskiyöllä ilman sivun
 * uudelleenlatausta. Ajastin tarkistaa päivän myös viimeistään tunnin välein
 * (kellonsiirrot) ja kun välilehti tulee takaisin näkyviin (laitteen lepotila).
 */
export function useToday(): DayRef {
  const [today, setToday] = useState(() => getTodayInHelsinki())

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const update = () => {
      clearTimeout(timer)
      const now = getTodayInHelsinki()
      setToday((prev) => (isSameDay(prev, now) ? prev : now))
      const delay = Math.min(getMsUntilHelsinkiMidnight() + 100, MAX_DELAY_MS)
      timer = setTimeout(update, delay)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') update()
    }

    update()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return today
}
