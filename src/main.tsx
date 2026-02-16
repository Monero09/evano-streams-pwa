import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // In dev: serve from src; In prod: serve from build root
        const swUrl = import.meta.env.DEV ? '/src/service-worker.ts' : '/service-worker.js';
        navigator.serviceWorker.register(swUrl, { type: 'module' })
            .then(reg => console.log('SW Registered: ', reg.scope))
            .catch(err => console.log('SW Failed: ', err));
    });
}

import { AuthProvider } from './components/AuthProvider';
import { ToastProvider } from './components/Toast';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ToastProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ToastProvider>
    </StrictMode>,
)
