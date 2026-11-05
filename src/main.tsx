import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker management:
// In development or on localhost, unregister all active service workers and clear caches
// so that fresh Vite HMR code is always served.
// In production (hosted domains), register SW for offline PWA functionality.
const isLocalhost = Boolean(
  typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname === '127.0.0.1')
);

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD && !isLocalhost) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('PWA ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('PWA ServiceWorker registration failed:', error);
        });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      const hadRegistrations = registrations.length > 0;
      for (const reg of registrations) {
        await reg.unregister();
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // If the page was controlled by a stale service worker, reload once to ensure raw network files are run
      if (hadRegistrations && navigator.serviceWorker.controller) {
        if (!sessionStorage.getItem('sw_purged')) {
          sessionStorage.setItem('sw_purged', 'true');
          window.location.reload();
        }
      }
    });
  }
}
