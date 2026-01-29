// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import  { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="center-top"
      reverseOrder={false}
      toastOptions={{
        style: {
          borderRadius: '10px', 
          background: '#333',
          color: '#fff',
        },
      }}
    />

  </React.StrictMode>
)