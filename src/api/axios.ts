import axios from 'axios';

// Dirección base del backend. Las páginas utilizan esta misma instancia.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });
export default api;
