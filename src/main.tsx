import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppProvider } from './app/AppProvider';
import './styles/tokens.css';
import './styles/global.css';
import './styles/dashboard.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing');
createRoot(root).render(<StrictMode><AppProvider><App /></AppProvider></StrictMode>);
