import { useRegisterSW } from 'virtual:pwa-register/react'
import { FC } from 'react'
import './Toast.css' // Reusing Toast styles

export const ReloadPrompt: FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="toast-container" style={{ bottom: '80px', zIndex: 9999 }}>
      <div className="toast toast-info">
        <div className="toast-message">
          {offlineReady
            ? 'App ready to work offline'
            : 'New content available, click on reload button to update.'}
        </div>
        {needRefresh && (
          <button 
            className="toast-action-btn" 
            onClick={() => updateServiceWorker(true)}
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
