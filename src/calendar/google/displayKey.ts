// Näyttöavain: jaettu salasana, jolla tämä laite saa kysyä tapahtumat backendiltä.
// Avain annetaan kerran (lomakkeella tai osoitteella /#key=...) ja tallennetaan laitteelle.

const STORAGE_KEY = 'kotinaytto.display-key'

export function getStoredKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeKey(key: string) {
  try {
    localStorage.setItem(STORAGE_KEY, key)
  } catch {
    // Tallennus ei ole käytössä: avain säilyy vain tämän istunnon
  }
}

/**
 * Lukee avaimen osoitteen fragmentista (#key=...), tallentaa sen ja poistaa fragmentin
 * osoiteriviltä, jottei avain jää selainhistoriaan. Muuten palauttaa tallennetun avaimen.
 */
export function loadDisplayKey(): string | null {
  const match = /(?:^#|&)key=([^&]+)/.exec(window.location.hash)
  if (match) {
    const key = decodeURIComponent(match[1])
    storeKey(key)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    return key
  }
  return getStoredKey()
}
