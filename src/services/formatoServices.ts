// Presenta los importes en quetzales, siempre con dos decimales.
export const moneda = (valor: number) =>
    new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
    }).format(valor);

// Conserva la fecha del hotel sin desplazarla por la zona horaria del navegador.
export const fechaCorta = (valor: string) => valor.slice(0, 10).split('-').reverse().join('/');

// Obtiene la fecha actual de Guatemala para los formularios.
export function fechaHoy() {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    return ['year', 'month', 'day']
        .map((tipo) => partes.find((p) => p.type === tipo)?.value)
        .join('-');
}

// Suma días usando UTC para que las fechas no cambien por horarios locales.
export function sumarDias(fecha: string, dias: number) {
    const resultado = new Date(fecha + 'T12:00:00Z');
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado.toISOString().slice(0, 10);
}

// Cuenta las noches entre entrada y salida, sin incluir el día de salida.
export const contarNoches = (entrada: string, salida: string) =>
    Math.max(0, Math.round((Date.parse(salida) - Date.parse(entrada)) / 86400000));
