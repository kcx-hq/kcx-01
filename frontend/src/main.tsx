// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import  { Toaster } from 'react-hot-toast';


const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-center"
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
