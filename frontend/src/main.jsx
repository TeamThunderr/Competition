import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// CRITICAL: Intercept the URL hash BEFORE any Supabase clients are imported
// Supabase aggressively clears the URL hash upon initialization, deleting the provider tokens.
if (window.location.hash?.includes('provider_refresh_token')) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const rt = hashParams.get('provider_refresh_token');
    if (rt) {
        sessionStorage.setItem('intercepted_google_refresh_token', rt);
    }
}

import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </BrowserRouter>,
)
