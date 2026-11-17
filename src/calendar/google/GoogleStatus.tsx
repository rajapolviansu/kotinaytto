import { useState, type FormEvent } from 'react'
import type { GoogleStatus as Status } from './useGoogleCalendar'
import './GoogleStatus.css'

interface GoogleStatusProps {
  status: Status
  stale: boolean
  onSaveKey: (key: string) => void
  onConnect: () => void
  onDisconnect: () => void
}

/** Näyttöavaimen syöttö, Google-tilin yhdistäminen ja yhteyden tila kuukausinäkymän otsikossa. */
function GoogleStatus({ status, stale, onSaveKey, onConnect, onDisconnect }: GoogleStatusProps) {
  const [key, setKey] = useState('')

  if (status === 'unavailable') return null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSaveKey(key)
    setKey('')
  }

  return (
    <div className="google-status">
      {stale && (
        <span className="google-note" role="status">
          Tieto ei ole ajan tasalla
        </span>
      )}
      {(status === 'needs-key' || status === 'unauthorized') && (
        <form className="google-key-form" onSubmit={submit}>
          {status === 'unauthorized' && (
            <span className="google-note" role="alert">
              Avain ei kelpaa
            </span>
          )}
          <input
            type="password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="Näyttöavain"
            aria-label="Näyttöavain"
            autoComplete="off"
          />
          <button type="submit">Tallenna</button>
        </form>
      )}
      {status === 'not-connected' && (
        <button type="button" onClick={onConnect}>
          Yhdistä Google-kalenteri
        </button>
      )}
      {status === 'loading' && <span className="google-note">Haetaan…</span>}
      {status === 'connected' && (
        <button type="button" className="google-disconnect" onClick={onDisconnect}>
          Katkaise yhteys
        </button>
      )}
    </div>
  )
}

export default GoogleStatus
