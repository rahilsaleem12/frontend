import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Register PWA Service Worker
serviceWorkerRegistration.register({
  onSuccess: () => console.log('[SmartPOS] PWA ready for offline use'),
  onUpdate: (registration) => {
    const waiting = registration.waiting;
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
});
