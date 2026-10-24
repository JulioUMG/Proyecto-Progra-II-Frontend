import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { listarReservas, actualizarEstadoReserva } from '../services/reservacionServices';
import { obtenerMensajeError } from '../services/errorServices';
import { moneda, fechaCorta } from '../services/formatoServices';
import type { Reserva } from '../types/reservacion';

const cambios: Record<string, string[]> = {
    PENDIENTE: ['CONFIRMADA', 'RECHAZADA', 'CANCELADA'],
    CONFIRMADA: ['HOSPEDADO', 'CANCELADA'],
    HOSPEDADO: ['FINALIZADA'],
};
const acciones: Record<string, string> = {
    CONFIRMADA: 'Confirmar',
    RECHAZADA: 'Rechazar',
    CANCELADA: 'Cancelar',
    HOSPEDADO: 'Registrar entrada',
    FINALIZADA: 'Registrar salida',
};

// Permite revisar solicitudes y avanzar cada reserva por sus estados válidos.
export default function Reservaciones() {
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [estado, setEstado] = useState('TODAS');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [confirmar, setConfirmar] = useState<{ reserva: Reserva; estado: string } | null>(null);

    // Recarga la tabla después de completar una acción.
    async function cargarReservas() {
        try {
            setReservas((await listarReservas()).data);
            setError('');
        } catch (error) {
            setError(obtenerMensajeError(error));
        } finally {
            setCargando(false);
        }
    }
    // Obtiene las reservaciones al abrir esta pantalla.
    useEffect(() => {
        let activo = true;
        // Ignora la respuesta si el usuario ya salió de esta pantalla.
        listarReservas()
            .then((respuesta) => {
                if (activo) setReservas(respuesta.data);
            })
            .catch((error) => {
                if (activo) setError(obtenerMensajeError(error));
            })
            .finally(() => {
                if (activo) setCargando(false);
            });
        return () => {
            activo = false;
        };
    }, []);

    // Solicita el cambio; el backend comprueba el estado y las fechas permitidas.
    async function cambiarEstado() {
        if (!confirmar || procesando) return;
        setProcesando(true);
        try {
            await actualizarEstadoReserva(confirmar.reserva.idReservacion, confirmar.estado);
            toast.success('Reservación actualizada');
            setConfirmar(null);
            await cargarReservas();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setProcesando(false);
        }
    }
    const visibles = reservas.filter(
        (r) =>
            (estado === 'TODAS' || r.estadoReservacion === estado) &&
            `${r.idReservacion} ${r.nombre} ${r.dpi} ${r.habitaciones.join(' ')}`
                .toLowerCase()
                .includes(busqueda.toLowerCase()),
    );

    return (
        <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-[#7b8968]">
                        RECEPCIÓN
                    </p>
                    <h1 className="mb-3 text-4xl font-medium tracking-tight">Reservaciones</h1>
                    <p className="text-sm leading-7 text-[#6a7367]">
                        De la primera solicitud al momento de despedirse.
                    </p>
                </div>
                <Link
                    className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    to="/sistema/nueva"
                >
                    + Nueva reservación
                </Link>
            </div>
            <div className="my-6 flex flex-wrap items-end gap-4">
                <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                    Buscar
                    <input
                        className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                        type="search"
                        placeholder="Nombre, DPI, reserva o habitación"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </label>
                <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                    Estado
                    <select
                        className="min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                    >
                        {[
                            'TODAS',
                            'PENDIENTE',
                            'CONFIRMADA',
                            'HOSPEDADO',
                            'FINALIZADA',
                            'CANCELADA',
                            'RECHAZADA',
                        ].map((e) => (
                            <option key={e}>{e}</option>
                        ))}
                    </select>
                </label>
                <p className="text-sm leading-7 text-[#6a7367]">{visibles.length} registros</p>
            </div>
            {error && (
                <p
                    className="my-5 rounded-lg border border-[#dce3d2] bg-[#eef2e7] p-4 text-sm text-[#617251] border-red-200! bg-red-50! text-red-800!"
                    role="alert"
                >
                    {error}
                </p>
            )}
            <section className="mb-6 overflow-hidden rounded-xl border border-[#e4e5dc] bg-white overflow-x-auto">
                {cargando ? (
                    <p
                        className="col-span-full p-10 text-center text-sm text-[#7a8175]"
                        role="status"
                    >
                        Cargando reservaciones…
                    </p>
                ) : (
                    <>
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Reserva / huésped
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Habitaciones
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Estancia
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Total
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Estado
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibles.map((r) => (
                                    <tr key={r.idReservacion}>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <strong>
                                                RH-{r.idReservacion} · {r.nombre}
                                            </strong>
                                            <small className="mt-2 block text-[11px] leading-6 text-[#8a9380]">
                                                DPI: {r.dpi}
                                                <br />
                                                Tel. {r.telefono}
                                            </small>
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            {r.habitaciones.join(', ')}
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            {fechaCorta(r.fechaIngreso)}
                                            <small className="mt-2 block text-[11px] leading-6 text-[#8a9380]">
                                                al {fechaCorta(r.fechaSalida)}
                                            </small>
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            {moneda(r.total)}
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <span className="inline-flex whitespace-nowrap rounded bg-[#edf1e5] px-2 py-1 text-[9px] font-bold tracking-wide text-[#63784f]">
                                                {r.estadoReservacion}
                                            </span>
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {(cambios[r.estadoReservacion] || []).map(
                                                    (estado) => (
                                                        <button
                                                            key={estado}
                                                            className="rounded-lg border border-[#d7ddcf] bg-[#f6f8f2] px-3 py-2 text-xs font-semibold text-[#4d5e42] transition hover:bg-[#eaf0e0] disabled:opacity-50"
                                                            onClick={() =>
                                                                setConfirmar({ reserva: r, estado })
                                                            }
                                                        >
                                                            {acciones[estado]}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!visibles.length && (
                            <p className="col-span-full p-10 text-center text-sm text-[#7a8175]">
                                No hay reservaciones con estos filtros.
                            </p>
                        )}
                    </>
                )}
            </section>
            {confirmar && (
                <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-[#12221599] p-5">
                    <section
                        className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-confirmar"
                    >
                        <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-[#7b8968]">
                            CONFIRMAR ACCIÓN
                        </p>
                        <h2
                            className="mb-3 text-2xl font-medium tracking-tight"
                            id="titulo-confirmar"
                        >
                            {acciones[confirmar.estado]}
                        </h2>
                        <p className="text-sm leading-7 text-[#6a7367]">
                            Reserva RH-{confirmar.reserva.idReservacion} de{' '}
                            {confirmar.reserva.nombre}.
                        </p>
                        <p className="text-sm leading-7 text-[#6a7367]">
                            El nuevo estado será <strong>{confirmar.estado}</strong>.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                autoFocus
                                className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 border-[#cbd3c3] bg-white! text-[#4d5e42]!"
                                disabled={procesando}
                                onClick={() => setConfirmar(null)}
                            >
                                Volver
                            </button>
                            <button
                                className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={procesando}
                                onClick={cambiarEstado}
                            >
                                {procesando ? 'Guardando…' : 'Confirmar acción'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
