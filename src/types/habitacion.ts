export interface Habitacion {
    idHabitacion: number;
    numero: string;
    tipo: string;
    precioNoche: number;
    estado: boolean;
    estadoHabitacion: string;
    disponibilidad?: string;
}
