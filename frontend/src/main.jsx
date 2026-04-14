import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';
import './app/index.css';
import axios from 'axios';


import { AuthProvider } from './app/context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = '69420'; //vıp kartı-ngrok engeli aşması sağlanıyor.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  </React.StrictMode>
);