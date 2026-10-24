import api from '../api/axios';
import type { Sesion } from '../types/sesion';

// Solicita el token que protege los formularios de la aplicación.
export async function prepararFormulario() {
    const { data } = await api.get<{ token: string; headerName: string }>('/api/auth/csrf');
    api.defaults.headers.common[data.headerName] = data.token;
}

// Envía las credenciales y renueva el token después de iniciar sesión.
export async function iniciarSesion(usuario: string, contrasena: string) {
    await prepararFormulario();
    await api.post(
        '/api/auth/login',
        new URLSearchParams({ username: usuario, password: contrasena }),
    );
    await prepararFormulario();
    return consultarSesion();
}

// Obtiene la cuenta y el perfil de la sesión actual.
export const consultarSesion = () => api.get<Sesion>('/api/auth/me');

// Cierra la sesión del servidor y elimina su token del cliente.
export async function cerrarSesion() {
    await prepararFormulario();
    await api.post('/api/auth/logout');
    delete api.defaults.headers.common['X-XSRF-TOKEN'];
}
