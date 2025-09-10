import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './Routing.jsx'
import "./i18n"
import {I18nextProvider} from "react-i18next";
import i18next from 'i18next';





ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18next}>
      <App />
    </I18nextProvider>
  </React.StrictMode>,
)
