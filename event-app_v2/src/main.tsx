import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider, ToastProvider } from '@/contexts'
import { ReloadPrompt } from '@components/common'
import '@/index.css'
import App from '@/App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// Set CSS variable --vh to handle mobile browser UI (keyboard) resizing.
// Use this value in CSS instead of 100vh to avoid content jumping when keyboard appears.
function setVh() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

setVh()
window.addEventListener('resize', setVh)
window.addEventListener('orientationchange', setVh)
// update on focusin/focusout to catch keyboard show/hide in some browsers
window.addEventListener('focusin', setVh)
window.addEventListener('focusout', setVh)

// Disable browser back navigation by keeping a non-navigable history state.
// When the user presses Back, we immediately push the state again so nothing happens.
function disableBackNavigation() {
  try {
    // Ensure there's a predictable state object we can check on popstate
    const state = { noBack: true }
    // Replace current state then push a duplicate so the back button targets our state
    history.replaceState(state, '', location.href)
    history.pushState(state, '', location.href)

    window.addEventListener('popstate', (ev) => {
      // If the popped state is ours, push it back again to prevent leaving
      if (ev.state && (ev.state as any).noBack) {
        history.pushState(state, '', location.href)
      }
    })
  } catch (err) {
    // Fail gracefully — do not break app if the browser forbids history manipulation
    // eslint-disable-next-line no-console
    console.warn('disableBackNavigation failed', err)
  }
}

// Activate behavior by default. If you want to limit it to specific routes,
// call this from route components instead.
disableBackNavigation()

createRoot(rootElement).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
        <ReloadPrompt />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
