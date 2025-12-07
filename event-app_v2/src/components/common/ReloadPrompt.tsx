import { useRegisterSW } from 'virtual:pwa-register/react'
import { FC, useEffect, useRef, useState } from 'react'
import './Toast.css' // Reusing Toast styles

export const ReloadPrompt: FC = () => {
  // useRegisterSW may return tuples ([flag, setFlag]) depending on version.
  // Destructure tuples to get boolean flags.
  const {
    offlineReady: [offlineReady, _setOfflineReady],
    needRefresh: [needRefresh, _setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const [visible, setVisible] = useState(false)
  // remember last seen values when user dismissed the toast so it doesn't reappear
  const dismissedRef = useRef({ offlineReady: false, needRefresh: false })

  useEffect(() => {
    // show toast only when at least one flag is true and it differs from dismissed values
    const shouldShow = (offlineReady || needRefresh) && (
      offlineReady !== dismissedRef.current.offlineReady ||
      needRefresh !== dismissedRef.current.needRefresh
    )
    if (shouldShow) setVisible(true)
  }, [offlineReady, needRefresh])

  const close = () => {
    // mark current SW flags as dismissed so the toast won't immediately re-open
    dismissedRef.current = { offlineReady, needRefresh }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="toast-container" style={{ bottom: '3%', zIndex: 9999 }}>
      <div className="toast toast-info">
        <div className="toast-message">
          {offlineReady
            ? 'App ready to work offline'
            : 'New content available, click on reload button to update.'}
        </div>
        {needRefresh && (
          <button
            className="toast-action-btn"
            onClick={() => {
              try {
                updateServiceWorker(true)
              } catch (e) {
                console.error('updateServiceWorker error', e)
              }
              // mark dismissed for current state to avoid reopening
              dismissedRef.current = { offlineReady, needRefresh }
              setVisible(false)
            }}
            style={{ marginLeft: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid currentColor', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
          >
            Reload
          </button>
        )}
        <button
          className="toast-close"
          onClick={close}
          style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
