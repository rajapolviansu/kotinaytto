import type { GoogleStatus as Status } from './useGoogleCalendar'
import './GoogleStatus.css'

interface GoogleStatusProps {
  status: Status
  stale: boolean
  onConnect: () => void
  onDisconnect: () => void
}

/** Google-tilin yhdistämisen tila ja painikkeet kuukausinäkymän otsikossa. */
function GoogleStatus({ status, stale, onConnect, onDisconnect }: GoogleStatusProps) {
  if (status === 'unavailable') return null

  return (
    <div className="google-status">
      {stale && (
        <span className="google-note" role="status">
          Tieto ei ole ajan tasalla
        </span>
      )}
      {status === 'disconnected' && (
        <button type="button" onClick={onConnect}>
          Yhdistä Google-kalenteri
        </button>
      )}
      {status === 'connecting' && <span className="google-note">Yhdistetään…</span>}
      {status === 'reauth' && (
        <>
          <span className="google-note" role="alert">
            Kirjautuminen vanhentui
          </span>
          <button type="button" onClick={onConnect}>
            Kirjaudu uudelleen
          </button>
        </>
      )}
      {status === 'connected' && (
        <button type="button" className="google-disconnect" onClick={onDisconnect}>
          Katkaise yhteys
        </button>
      )}
    </div>
  )
}

export default GoogleStatus
