import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { AuthProvider } from '@/context/AuthContext'
import { tokenStorage } from '@/utils/tokenStorage'
import './index.css'
import './chatwoot-theme.css'

const queryClient = new QueryClient()

const applyEmbedMode = (isEmbed: boolean) => {
  document.body.classList.toggle('chatwoot-embed', isEmbed)
}

const applyTheme = (theme: string | null) => {
  const resolved = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.chatwootTheme = resolved
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

const initFromQuery = () => {
  const params = new URLSearchParams(window.location.search)
  const isEmbed = params.get('embed') === '1'
  const theme = params.get('theme')
  applyEmbedMode(isEmbed)
  applyTheme(theme)
}

const initPostMessageBridge = () => {
  const rawAllowed = import.meta.env.VITE_CHAT_EMBED_ALLOWED_ORIGINS || ''
  const allowedOrigins = rawAllowed
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean)

  window.addEventListener('message', (event) => {
    const isAllowed =
      event.origin === window.location.origin ||
      allowedOrigins.includes(event.origin)

    if (!isAllowed) {
      return
    }

    const data = event.data || {}
    if (data.type !== 'whatpro:embed:init') {
      return
    }

    if (typeof data.theme === 'string') {
      applyTheme(data.theme)
    }

    if (data.accountId) {
      tokenStorage.setAccountId(String(data.accountId))
    }

    if (data.userId) {
      // We don't have a direct setter for user_id in tokenStorage if it's just ID, 
      // but let's see. tokenStorage.setUser takes an object. 
      // The legacy code sets 'user_id'. tokenStorage doesn't explicitly manage 'user_id' standalone key usually, 
      // but let's check tokenStorage definition.
      localStorage.setItem('user_id', String(data.userId))
    }

    if (data.token) {
      tokenStorage.setToken(String(data.token))
    }
  })
}

initFromQuery()
initPostMessageBridge()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
