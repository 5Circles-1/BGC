import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/app.css'
import { themeStyle } from './theme'
import { StoreProvider } from './state/store'
import App from './App'

// Inject the token sheet (dark-first, light override, OS-preference guard)
const style = document.createElement('style')
style.textContent = themeStyle()
document.head.appendChild(style)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
)
