import api from '../api/axios';
import { prepararFormulario } from './sesionServices';
import type { SolicitudReserva, Confirmacion, Reserva } from '../types/reservacion';

// Obtiene las reservas con los datos de huésped y habitaciones.
export const listarReservas = () => api.get<Reserva[]>('/api/admin/reservas');

// Envía la solicitud pública o la reserva registrada en recepción.
export async function crearReserva(datos: SolicitudReserva, interna = false) {
    await prepararFormulario();
    const ruta = interna ? '/api/admin/reservas' : '/api/public/reservas';
    return api.post<Confirmacion>(ruta, datos);
}

// Confirma, cancela o avanza una estancia por su siguiente estado.
export async function actualizarEstadoReserva(id: number, estado: string) {
    await prepararFormulario();
    return api.put(`/api/admin/reservas/${id}/estado`, { estado });
}
