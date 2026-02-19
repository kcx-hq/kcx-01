// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import  { Toaster } from 'react-hot-toast';
import Demo from './Demo.jsx';
import Demo1 from './Demo1.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
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