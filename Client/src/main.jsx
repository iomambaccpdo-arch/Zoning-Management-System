import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Import all CSS files
import '../Styles/general.css'
import '../Styles/login.css'
import '../Styles/sidebar.css'
import '../Styles/main.css'
import '../Styles/forms.css'
import '../Styles/password.css'
import '../Styles/documents.css'
import '../Styles/account.css'
import '../Styles/table-for-account.css'
import '../Styles/create-user.css'
import '../Styles/modal.css'
import '../Styles/upload.css'
import '../Styles/new-document.css'
import '../Styles/multi-select.css'
import '../Styles/searchable-select.css'
import '../Styles/card-grid.css'
import '../Styles/upload-settings.css'
import '../Styles/utilities.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
