import { describe, expect, it } from 'vitest'
import {
  getDaysInMonth,
  getMonthGrid,
  getMonthTitle,
  getWeekdayIndex,
  isLeapYear,
  shiftMonth,
  WEEKDAY_LABELS,
} from './dateUtils'

describe('shiftMonth', () => {
  it('siirtyy seuraavaan ja edelliseen kuukauteen saman vuoden sisällä', () => {
    expect(shiftMonth(2026, 5, 1)).toEqual({ year: 2026, month: 6 })
    expect(shiftMonth(2026, 5, -1)).toEqual({ year: 2026, month: 4 })
  })
  it('joulukuusta eteenpäin siirrytään seuraavan vuoden tammikuuhun', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 })
  })
  it('tammikuusta taaksepäin siirrytään edellisen vuoden joulukuuhun', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 })
  })
})

describe('isLeapYear', () => {
  it('tunnistaa karkausvuodet', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2000)).toBe(true)
  })
  it('hylkää tavalliset vuodet ja satavuodet', () => {
    expect(isLeapYear(2026)).toBe(false)
    expect(isLeapYear(1900)).toBe(false)
  })
})

describe('getDaysInMonth', () => {
  it('helmikuussa on 29 päivää karkausvuonna', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29)
  })
  it('helmikuussa on 28 päivää tavallisena vuonna', () => {
    expect(getDaysInMonth(2026, 1)).toBe(28)
  })
  it('palauttaa 30 tai 31 muille kuukausille', () => {
    expect(getDaysInMonth(2026, 3)).toBe(30)
    expect(getDaysInMonth(2026, 10)).toBe(30)
    expect(getDaysInMonth(2026, 0)).toBe(31)
    expect(getDaysInMonth(2026, 11)).toBe(31)
  })
})

describe('getWeekdayIndex', () => {
  it('maanantai on 0 ja sunnuntai 6', () => {
    expect(getWeekdayIndex(2026, 10, 16)).toBe(0) // ma 16.11.2026
    expect(getWeekdayIndex(2026, 10, 1)).toBe(6) // su 1.11.2026
  })
})

describe('getMonthTitle', () => {
  it('muodostaa suomenkielisen otsikon', () => {
    expect(getMonthTitle(2026, 10)).toBe('Marraskuu 2026')
  })
})

describe('getMonthGrid', () => {
  it('jokaisella viikolla on 7 päivää', () => {
    for (let m = 0; m < 12; m++) {
      for (const week of getMonthGrid(2026, m)) expect(week).toHaveLength(7)
    }
  })

  it('kuukausi joka alkaa sunnuntaina: marraskuu 2026', () => {
    const grid = getMonthGrid(2026, 10)
    expect(grid).toHaveLength(6)
    // Ensimmäinen viikko: 26.–31.10. täyttöpäiviä, 1.11. sunnuntaina
    expect(grid[0].slice(0, 6).map((d) => d.day)).toEqual([26, 27, 28, 29, 30, 31])
    expect(grid[0].slice(0, 6).every((d) => !d.inMonth && d.month === 9)).toBe(true)
    expect(grid[0][6]).toMatchObject({ day: 1, month: 10, inMonth: true })
    // Viimeinen viikko: 30.11. + täyttöpäivät 1.–6.12.
    expect(grid[5][0]).toMatchObject({ day: 30, inMonth: true })
    expect(grid[5].slice(1).map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6])
    expect(grid[5].slice(1).every((d) => !d.inMonth && d.month === 11)).toBe(true)
  })

  it('karkausvuoden helmikuussa on 29 kuukauden päivää', () => {
    const days = getMonthGrid(2024, 1).flat().filter((d) => d.inMonth)
    expect(days).toHaveLength(29)
    expect(days.at(-1)?.day).toBe(29)
  })

  it('kuukausi joka alkaa maanantaina ei sisällä edellisen kuukauden päiviä: helmikuu 2027', () => {
    const grid = getMonthGrid(2027, 1)
    expect(grid[0][0]).toMatchObject({ day: 1, month: 1, inMonth: true })
    expect(grid).toHaveLength(4)
  })

  it('käsittelee vuodenvaihteen täyttöpäivät: tammikuu 2026', () => {
    const grid = getMonthGrid(2026, 0)
    expect(grid[0][0]).toMatchObject({ year: 2025, month: 11, day: 29, inMonth: false })
  })
})

describe('WEEKDAY_LABELS', () => {
  it('alkaa maanantaista', () => {
    expect(WEEKDAY_LABELS).toEqual(['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'])
  })
})
