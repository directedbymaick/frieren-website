import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'lenis/dist/lenis.css';
import App from './App.jsx';
import './styles/globals.css';
import { initLenis } from './lib/lenis.js';

// Bootstrap Lenis before React renders so the rAF loop is running by the time
// the first scroll-driven hook reads window.scrollY.
initLenis();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
