import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId="474979397544-i1gal4qaq4ftbejhn1gb96gdbfgobt25.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)
