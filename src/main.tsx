// Disable Google One-Tap auto-select on load
if (window.google?.accounts?.id) {
  window.google.accounts.id.disableAutoSelect();
}

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
