import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ThemeModeProvider } from './context/ThemeModeContext';
import { AppProvider } from './context/AppContext';

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AppProvider>
            <CssBaseline />
            <App />
          </AppProvider>
        </LocalizationProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
