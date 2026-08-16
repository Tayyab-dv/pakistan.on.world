import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

/**
 * Deliberately not wrapped in <StrictMode>.
 *
 * StrictMode double-invokes effects in development, which would create, tear
 * down and recreate a WebGL context and its textures on every mount. For an
 * application whose central requirement is a single persistent scene that never
 * remounts, that is the wrong development-time behaviour to opt into.
 */
const container = document.getElementById('root')
if (!container) throw new Error('Root container missing')

createRoot(container).render(<App />)
