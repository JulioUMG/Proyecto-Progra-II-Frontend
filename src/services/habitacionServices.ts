import api from '../api/axios';
import { prepararFormulario } from './sesionServices';
import type { Habitacion } from '../types/habitacion';

type DatosHabitacion = Pick<Habitacion, 'numero' | 'tipo' | 'precioNoche'>;

// Consulta las habitaciones públicas sin incluir datos de los huéspedes.
export const consultarDisponibilidad = (entrada: string, salida: string) =>
    api.get<Habitacion[]>('/api/public/disponibilidad', { params: { entrada, salida } });

// Consulta el inventario completo para el personal.
export const listarHabitaciones = () => api.get<Habitacion[]>('/api/admin/habitaciones');

// Crea una habitación desde el formulario de administración.
export async function crearHabitacion(datos: DatosHabitacion) {
    await prepararFormulario();
    return api.post<Habitacion>('/api/admin/habitaciones', datos);
}

// Modifica número, tipo y precio sin alterar el estado operativo.
export async function actualizarHabitacion(id: number, datos: DatosHabitacion) {
    await prepararFormulario();
    return api.put<Habitacion>(`/api/admin/habitaciones/${id}/datos`, datos);
}

// Cambia el estado de limpieza o mantenimiento.
export async function cambiarEstadoHabitacion(id: number, estado: string) {
    await prepararFormulario();
    return api.put(`/api/admin/habitaciones/${id}/estado`, { estado });
}
