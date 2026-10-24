import axios from 'axios';

// Extrae el mensaje del backend y ofrece uno sencillo si falla la conexión.
export function obtenerMensajeError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
            return 'Inicia sesión o revisa tu usuario y contraseña.';
        if (error.response?.status === 403)
            return 'Tu perfil no permite esta acción. Actualiza la página si tu sesión venció.';
        return (
            error.response?.data?.mensaje ||
            'No se pudo completar la operación. Revisa la conexión con el hotel.'
        );
    }
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
