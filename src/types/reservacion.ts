export interface SolicitudReserva {
    nombre: string;
    dpi: string;
    telefono: string;
    entrada: string;
    salida: string;
    habitaciones: number[];
}

export interface Confirmacion {
    idReservacion: number;
    total: number;
    estadoReservacion: string;
}

export interface Reserva {
    idReservacion: number;
    nombre: string;
    dpi: string;
    telefono: string;
    fechaIngreso: string;
    fechaSalida: string;
    total: number;
    estadoReservacion: string;
    habitaciones: string[];
}
