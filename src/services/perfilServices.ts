import api from '../api/axios';
import type { Perfil } from '../types/perfil';

// Consulta los perfiles existentes para asignarlos al personal.
export const listarPerfiles = () => api.get<Perfil[]>('/perfiles');
