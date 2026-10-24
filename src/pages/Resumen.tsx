import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { listarReservas } from '../services/reservacionServices';
import { listarHabitaciones } from '../services/habitacionServices';
import { obtenerMensajeError } from '../services/errorServices';
import { fechaHoy, fechaCorta, moneda } from '../services/formatoServices';
import type { Habitacion } from '../types/habitacion';
import type { Reserva } from '../types/reservacion';

// Muestra una vista rápida de la operación y de las últimas solicitudes.
export default function Resumen() {
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    // Carga ambos listados juntos al abrir el resumen.
    useEffect(() => {
        let activo = true;
        async function cargarResumen() {
            try {
                const [r, h] = await Promise.all([listarReservas(), listarHabitaciones()]);
                if (activo) {
                    setReservas(r.data);
                    setHabitaciones(h.data);
                }
            } catch (error) {
                if (activo) setError(obtenerMensajeError(error));
            } finally {
                if (activo) setCargando(false);
            }
        }
        cargarResumen();
        return () => {
            activo = false;
        };
    }, []);

    const indicadores = [
        [
            'Por revisar',
            reservas.filter((r) => r.estadoReservacion === 'PENDIENTE').length,
            'Solicitudes pendientes',
        ],
        [
            'Entradas de hoy',
            reservas.filter(
                (r) =>
                    r.fechaIngreso.slice(0, 10) === fechaHoy() &&
                    r.estadoReservacion === 'CONFIRMADA',
            ).length,
            'Reservaciones confirmadas',
        ],
        [
            'Huéspedes alojados',
            reservas.filter((r) => r.estadoReservacion === 'HOSPEDADO').length,
            'Estancias en curso',
        ],
        ['Habitaciones', habitaciones.filter((h) => h.estado).length, 'Habitaciones activas'],
    ];
    return (
        <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-[#7b8968]">
                        UNA MIRADA AL DÍA
                    </p>
                    <h1 className="mb-3 text-4xl font-medium tracking-tight">
                        Todo listo para recibir.
                    </h1>
                    <p className="text-sm leading-7 text-[#6a7367]">
                        Consulta lo que necesita tu atención.
                    </p>
                </div>
                <Link
                    className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    to="/sistema/nueva"
                >
                    + Nueva reservación
                </Link>
            </div>
            {error && (
                <p
                    className="my-5 rounded-lg border border-[#dce3d2] bg-[#eef2e7] p-4 text-sm text-[#617251] border-red-200! bg-red-50! text-red-800!"
                    role="alert"
                >
                    {error}
                </p>
            )}
            {cargando ? (
                <p className="text-sm leading-7 text-[#6a7367]" role="status">
                    Cargando resumen…
                </p>
            ) : (
                <>
                    <div className="my-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {indicadores.map(([titulo, valor, nota], i) => (
                            <motion.article
                                key={titulo}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <span>{titulo}</span>
                                <strong className="text-4xl font-medium">{valor}</strong>
                                <small className="mt-2 block text-[11px] leading-6 text-[#8a9380]">
                                    {nota}
                                </small>
                            </motion.article>
                        ))}
                    </div>
                    <section className="mb-6 overflow-hidden rounded-xl border border-[#e4e5dc] bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e4e5dc] p-6">
                            <div>
                                <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-[#7b8968]">
                                    RESERVACIONES RECIENTES
                                </p>
                                <h2 className="mb-3 text-2xl font-medium tracking-tight">
                                    Las próximas historias.
                                </h2>
                            </div>
                            <Link to="/sistema/reservaciones">Ver todas →</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr>
                                        <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                            Reserva
                                        </th>
                                        <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                            Huésped
                                        </th>
                                        <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                            Entrada
                                        </th>
                                        <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                            Total
                                        </th>
                                        <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservas.slice(0, 6).map((r) => (
                                        <tr key={r.idReservacion}>
                                            <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                                RH-{r.idReservacion}
                                            </td>
                                            <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                                {r.nombre}
                                            </td>
                                            <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                                {fechaCorta(r.fechaIngreso)}
                                            </td>
                                            <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                                {moneda(r.total)}
                                            </td>
                                            <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                                <span className="inline-flex whitespace-nowrap rounded bg-[#edf1e5] px-2 py-1 text-[9px] font-bold tracking-wide text-[#63784f]">
                                                    {r.estadoReservacion}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!reservas.length && (
                                <p className="col-span-full p-10 text-center text-sm text-[#7a8175]">
                                    Todavía no hay reservaciones. Registra la primera desde el botón
                                    superior.
                                </p>
                            )}
                        </div>
                    </section>
                    <div className="flex flex-wrap items-center justify-between gap-7 rounded-xl bg-[#e9eddf] p-7">
                        <div>
                            <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-[#7b8968]">
                                LOS DETALLES HACEN LA DIFERENCIA
                            </p>
                            <h2 className="mb-3 text-2xl font-medium tracking-tight">
                                Una buena estancia empieza con una buena atención.
                            </h2>
                        </div>
                        <p className="text-sm leading-7 text-[#6a7367]">
                            Entrada: 15:00 · Salida: 12:00
                            <br />
                            Revisa las solicitudes y prepara las habitaciones antes de cada llegada.
                        </p>
                    </div>
                </>
            )}
        </>
    );
}
