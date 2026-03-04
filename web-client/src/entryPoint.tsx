
// setup-web is now imported in init.ts (runs first via index.html)

import './assets/styles/index.css'
import './assets/styles/tailwind.css'
import '@ant-design/v5-patch-for-react-19'

import { createRoot } from 'react-dom/client'

import App from './App'

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)
