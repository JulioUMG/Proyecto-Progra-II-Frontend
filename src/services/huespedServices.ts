import api from '../api/axios';
import { prepararFormulario } from './sesionServices';
import type { Huesped } from '../types/huesped';

// Consulta las fichas registradas en el hotel.
export const listarHuespedes = () => api.get<Huesped[]>('/huespedes');

// Actualiza los datos de la ficha seleccionada por recepción.
export async function actualizarHuesped(id: number, datos: Huesped) {
    await prepararFormulario();
    return api.put(`/huespedes/${id}`, datos);
}
