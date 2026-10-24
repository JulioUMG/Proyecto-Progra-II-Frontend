import api from '../api/axios';
import { prepararFormulario } from './sesionServices';
import type { Usuario } from '../types/usuario';

type NuevoUsuario = Omit<Usuario, 'idUsuario'> & { contrasena: string };

// Consulta el personal; el servidor permite esta ruta solo a administración.
export const listarUsuarios = () => api.get<Usuario[]>('/usuarios');

// Registra una cuenta y entrega la contraseña al servidor para cifrarla.
export async function crearUsuario(datos: NuevoUsuario) {
    await prepararFormulario();
    return api.post('/usuarios', datos);
}

// Actualiza la cuenta para habilitar o retirar su acceso.
export async function actualizarUsuario(id: number, datos: Usuario) {
    await prepararFormulario();
    return api.put(`/usuarios/${id}`, datos);
}
