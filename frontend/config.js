const isLocal = window.location.hostname === 'localhost';
export const API_URL = isLocal 
    ? 'http://localhost:3000/api' 
    : 'https://bitmarket-3898.onrender.com/api';