export const WEEKDAY_LABELS = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']

export const MONTH_NAMES = [
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

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Kuukauden päivien määrä. month on 0-pohjainen (0 = tammikuu). */
export function getDaysInMonth(year, month) {
  if (month === 1) return isLeapYear(year) ? 29 : 28
  return [3, 5, 8, 10].includes(month) ? 30 : 31
}

/** Viikonpäivä maanantaista alkaen: 0 = maanantai ... 6 = sunnuntai. */
export function getWeekdayIndex(year, month, day) {
  const date = new Date(year, month, day)
  return (date.getDay() + 6) % 7
}

/**
 * Siirtää kuukautta delta kuukautta (negatiivinen = taaksepäin).
 * Käsittelee vuodenvaihteen molempiin suuntiin. month on 0-pohjainen.
 */
export function shiftMonth(year, month, delta) {
  const index = year * 12 + month + delta
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 }
}

export function getMonthTitle(year, month) {
  return `${MONTH_NAMES[month]} ${year}`
}

/**
 * Kuukausiruudukko: taulukko viikkoja, joissa kussakin 7 päivää (ma–su).
 * Edellisen ja seuraavan kuukauden täyttöpäivillä on inMonth: false.
 * month on 0-pohjainen.
 */
export function getMonthGrid(year, month) {
  const daysInMonth = getDaysInMonth(year, month)
  const leading = getWeekdayIndex(year, month, 1)
  const total = Math.ceil((leading + daysInMonth) / 7) * 7

  const cells = []
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

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
