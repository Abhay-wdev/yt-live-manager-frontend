import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App.tsx'
import './index.css'

axios.interceptors.request.use(config => {
  config.headers['Bypass-Tunnel-Reminder'] = 'true';
  return config;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
