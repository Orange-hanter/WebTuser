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
