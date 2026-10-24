import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Note: StrictMode removed to avoid double-mounting effects on the call timer
// (React 18+ StrictMode intentionally double-invokes effects in dev mode)
createRoot(document.getElementById('root')).render(<App />)
