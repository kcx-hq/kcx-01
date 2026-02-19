// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import  { Toaster } from 'react-hot-toast';
import Demo from './Demo';
import Demo1 from './Demo1';

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
    {/* <Demo/> */}
    {/* <Demo1/> */}
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
