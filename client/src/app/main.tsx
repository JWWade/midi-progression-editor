import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/index.css'
import { ThemeProvider } from './providers/ThemeProvider'
import { EnharmonicProvider } from './providers/EnharmonicProvider'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <EnharmonicProvider>
        <App />
      </EnharmonicProvider>
    </ThemeProvider>
  </StrictMode>,
)
