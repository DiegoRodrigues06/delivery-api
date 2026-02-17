import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './input.css'
import ApiTester from './pages/ApiTester'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApiTester />
  </StrictMode>,
)
