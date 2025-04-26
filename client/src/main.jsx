import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is not defined');
}

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={publishableKey}>
    <BrowserRouter>
    <App />
    </BrowserRouter>
    </ClerkProvider>
)