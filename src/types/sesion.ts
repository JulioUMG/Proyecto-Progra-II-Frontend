export interface Sesion {
    idUsuario: number;
    nombre: string;
    usuario: string;
    rol: 'ADMINISTRADOR' | 'RECEPCIONISTA';
}
