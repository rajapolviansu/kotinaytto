/** Kuukausi viitteenä. month on 0-pohjainen (0 = tammikuu). */
export interface MonthRef {
  year: number
  month: number
}

/** Kalenteripäivä. month on 0-pohjainen (0 = tammikuu). */
export interface DayRef extends MonthRef {
  day: number
}

/** Yksi ruutu kuukausiruudukossa. inMonth on false täyttöpäivillä. */
export interface CalendarDay extends DayRef {
  inMonth: boolean
}

export const WEEKDAY_LABELS: readonly string[] = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']

export const MONTH_NAMES: readonly string[] = [
  'Tammikuu',
  'Helmikuu',
  'Maaliskuu',
  'Huhtikuu',
  'Toukokuu',
  'Kesäkuu',
  'Heinäkuu',
  'Elokuu',
  'Syyskuu',
  'Lokakuu',
  'Marraskuu',
  'Joulukuu',
]

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Kuukauden päivien määrä. month on 0-pohjainen (0 = tammikuu). */
export function getDaysInMonth(year: number, month: number): number {
  if (month === 1) return isLeapYear(year) ? 29 : 28
  return [3, 5, 8, 10].includes(month) ? 30 : 31
}

/** Viikonpäivä maanantaista alkaen: 0 = maanantai ... 6 = sunnuntai. */
export function getWeekdayIndex(year: number, month: number, day: number): number {
  const date = new Date(year, month, day)
  return (date.getDay() + 6) % 7
}

/**
 * Siirtää kuukautta delta kuukautta (negatiivinen = taaksepäin).
 * Käsittelee vuodenvaihteen molempiin suuntiin. month on 0-pohjainen.
 */
export function shiftMonth(year: number, month: number, delta: number): MonthRef {
  const index = year * 12 + month + delta
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 }
}

export function getMonthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`
}

/**
 * Kuukausiruudukko: taulukko viikkoja, joissa kussakin 7 päivää (ma–su).
 * Edellisen ja seuraavan kuukauden täyttöpäivillä on inMonth: false.
 * month on 0-pohjainen.
 */
export function getMonthGrid(year: number, month: number): CalendarDay[][] {
  const daysInMonth = getDaysInMonth(year, month)
  const leading = getWeekdayIndex(year, month, 1)
  const total = Math.ceil((leading + daysInMonth) / 7) * 7

  const cells: CalendarDay[] = []
  for (let i = 0; i < total; i++) {
    // Date normalisoi yli- ja alivuotavat päivät oikeaan kuukauteen
    const date = new Date(year, month, 1 - leading + i)
    cells.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      inMonth: date.getMonth() === month && date.getFullYear() === year,
    })
  }

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export const CALENDAR_TIME_ZONE = 'Europe/Helsinki'

const helsinkiFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: CALENDAR_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})

function getHelsinkiParts(now: Date) {
  const parts: Record<string, number> = {}
  for (const { type, value } of helsinkiFormat.formatToParts(now)) {
    if (type !== 'literal') parts[type] = Number(value)
  }
  return parts
}

/** Kuluva päivä Suomen aikavyöhykkeellä riippumatta laitteen aikavyöhykkeestä. */
export function getTodayInHelsinki(now: Date = new Date()): DayRef {
  const { year, month, day } = getHelsinkiParts(now)
  return { year, month: month - 1, day }
}

/**
 * Arvio millisekunneista Suomen seuraavaan keskiyöhön. Arvio voi heittää
 * kellonsiirtopäivinä (enintään tunnin), joten kutsuja tarkistaa päivän uudelleen.
 */
export function getMsUntilHelsinkiMidnight(now: Date = new Date()): number {
  const { hour, minute, second } = getHelsinkiParts(now)
  const elapsed = ((hour * 60 + minute) * 60 + second) * 1000 + now.getMilliseconds()
  return 24 * 60 * 60 * 1000 - elapsed
}

/**
 * Suomen ajan hetki (month 0-pohjainen) Date-oliona riippumatta laitteen
 * aikavyöhykkeestä. Käsittelee kesäajan.
 */
export function helsinkiTimeToDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  const wanted = Date.UTC(year, month, day, hour, minute)
  let t = wanted
  for (let i = 0; i < 2; i++) {
    const p = getHelsinkiParts(new Date(t))
    t -= Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - wanted
  }
  return new Date(t)
}

/** Kellonaika muodossa "9.30" tai "14.05" Suomen ajassa. */
export function formatTimeInHelsinki(date: Date): string {
  const { hour, minute } = getHelsinkiParts(date)
  return `${hour}.${String(minute).padStart(2, '0')}`
}
