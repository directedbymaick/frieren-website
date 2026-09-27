import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/fonts.css';
import './styles/transitions/tokens.css';
import './styles/transitions/01-card-resize.css';
import './styles/transitions/05-menu-dropdown.css';
import './styles/transitions/06-modal.css';
import './styles/transitions/08-page-side-by-side.css';
import './styles/transitions/09-icon-swap.css';
import './styles/transitions/16-tabs-sliding.css';
import './styles/transitions/18-texts-reveal.css';
import './styles/transitions/19-card-tilt.css';
import './styles/transitions/21-accordion.css';
import './styles/globals.css';
import './styles/improvements.css';
import './styles/motion.css';
import './styles/entrance.css';
import './styles/hero-arrival.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
