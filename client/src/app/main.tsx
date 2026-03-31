import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/index.css'
import { ThemeProvider } from './providers/ThemeProvider'
import { EnharmonicProvider } from './providers/EnharmonicProvider'
import { TutorialProvider } from '../features/tutorial'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <EnharmonicProvider>
        <TutorialProvider>
          <App />
        </TutorialProvider>
      </EnharmonicProvider>
    </ThemeProvider>
  </StrictMode>,
)
