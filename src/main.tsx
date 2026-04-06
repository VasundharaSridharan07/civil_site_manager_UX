import React from 'react'
import ReactDOM from 'react-dom/client'
import { ModusWcThemeProvider } from '@trimble-oss/moduswebcomponents-react'
import App from './App.tsx'
import './index.css'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.setAttribute('data-theme', prefersDark ? 'modus-dark' : 'modus-classic')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModusWcThemeProvider>
      <App />
    </ModusWcThemeProvider>
  </React.StrictMode>,
)
