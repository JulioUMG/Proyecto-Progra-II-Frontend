import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
    listarHabitaciones,
    crearHabitacion,
    actualizarHabitacion,
    cambiarEstadoHabitacion,
} from '../services/habitacionServices';
import { obtenerMensajeError } from '../services/errorServices';
import { moneda } from '../services/formatoServices';
import type { Habitacion } from '../types/habitacion';

const formInicial = { numero: '', tipo: 'Sencilla', precioNoche: 250 };

// Gestiona las tarifas y el estado operativo de las habitaciones.
export default function Habitaciones({ administrador }: { administrador: boolean }) {
    const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
    const [form, setForm] = useState(formInicial);
    const [idEdicion, setIdEdicion] = useState<number | null>(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    // Consulta todas las habitaciones para actualizar la tabla.
    async function cargarHabitaciones() {
        try {
            setHabitaciones((await listarHabitaciones()).data);
            setError('');
        } catch (error) {
            setError(obtenerMensajeError(error));
        } finally {
            setCargando(false);
        }
    }
    // Carga el inventario al abrir la pantalla.
    useEffect(() => {
        let activo = true;
        // Ignora la respuesta si el usuario ya salió de esta pantalla.
        listarHabitaciones()
            .then((respuesta) => {
                if (activo) setHabitaciones(respuesta.data);
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

    // Prepara el formulario con los datos de una habitación o con valores iniciales.
    function abrirFormulario(habitacion?: Habitacion) {
        setIdEdicion(habitacion?.idHabitacion || null);
        setForm(
            habitacion
                ? {
                    numero: habitacion.numero,
                    tipo: habitacion.tipo,
                    precioNoche: habitacion.precioNoche,
                }
                : formInicial,
        );
        setMostrarFormulario(true);
    }

    // Guarda el número, tipo y tarifa sin alterar el estado operativo.
    async function guardarHabitacion(evento: FormEvent) {
        evento.preventDefault();
        setGuardando(true);
        try {
            if (idEdicion) await actualizarHabitacion(idEdicion, form);
            else await crearHabitacion(form);
            toast.success('Habitación guardada');
            setMostrarFormulario(false);
            await cargarHabitaciones();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setGuardando(false);
        }
    }

    // Cambia limpieza o mantenimiento; el servidor impide afectar una estancia en curso.
    async function cambiarEstado(id: number, estado: string) {
        setGuardando(true);
        try {
            await cambiarEstadoHabitacion(id, estado);
            toast.success('Estado actualizado');
            await cargarHabitaciones();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setGuardando(false);
        }
    }
    const visibles = habitaciones.filter((h) =>
        `${h.numero} ${h.tipo}`.toLowerCase().includes(busqueda.toLowerCase()),
    );

    return (
        <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-[#7b8968]">
                        ESPACIOS PARA DESCANSAR
                    </p>
                    <h1 className="mb-3 text-4xl font-medium tracking-tight">Habitaciones</h1>
                    <p className="text-sm leading-7 text-[#6a7367]">
                        Tarifas por noche y preparación para cada llegada.
                    </p>
                </div>
                {administrador && (
                    <button
                        className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => abrirFormulario()}
                    >
                        + Agregar habitación
                    </button>
                )}
            </div>
            <div className="my-6 flex flex-wrap items-end gap-4">
                <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                    Buscar habitación
                    <input
                        className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                        type="search"
                        placeholder="Número o tipo"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </label>
                <p className="text-sm leading-7 text-[#6a7367]">{visibles.length} habitaciones</p>
            </div>
            {error && (
                <p
                    role="alert"
                    className="my-5 rounded-lg border border-[#dce3d2] bg-[#eef2e7] p-4 text-sm text-[#617251] border-red-200! bg-red-50! text-red-800!"
                >
                    {error}
                </p>
            )}
            <div className="mb-6 overflow-hidden rounded-xl border border-[#e4e5dc] bg-white overflow-x-auto">
                {cargando ? (
                    <p
                        className="col-span-full p-10 text-center text-sm text-[#7a8175]"
                        role="status"
                    >
                        Cargando habitaciones…
                    </p>
                ) : (
                    <>
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Número
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Tipo
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Precio / noche
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Estado operativo
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibles.map((h) => (
                                    <tr key={h.idHabitacion}>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <strong>{h.numero}</strong>
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            {h.tipo}
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            {moneda(h.precioNoche)}
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <span className="inline-flex whitespace-nowrap rounded bg-[#edf1e5] px-2 py-1 text-[9px] font-bold tracking-wide text-[#63784f]">
                                                {h.estadoHabitacion}
                                            </span>
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {administrador && (
                                                    <button
                                                        className="rounded-lg border border-[#d7ddcf] bg-[#f6f8f2] px-3 py-2 text-xs font-semibold text-[#4d5e42] transition hover:bg-[#eaf0e0] disabled:opacity-50"
                                                        disabled={guardando}
                                                        onClick={() => abrirFormulario(h)}
                                                    >
                                                        Editar datos
                                                    </button>
                                                )}
                                                {h.estadoHabitacion !== 'OCUPADA' && (
                                                    <select
                                                        className="min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                                        aria-label={
                                                            'Cambiar estado de habitación ' +
                                                            h.numero
                                                        }
                                                        disabled={guardando}
                                                        value={h.estadoHabitacion}
                                                        onChange={(e) =>
                                                            cambiarEstado(
                                                                h.idHabitacion,
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        <option value="DISPONIBLE">
                                                            Lista para uso
                                                        </option>
                                                        <option value="LIMPIEZA">
                                                            En limpieza
                                                        </option>
                                                        <option value="MANTENIMIENTO">
                                                            Mantenimiento
                                                        </option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!visibles.length && (
                            <p className="col-span-full p-10 text-center text-sm text-[#7a8175]">
                                No hay habitaciones con esta búsqueda.
                            </p>
                        )}
                    </>
                )}
            </div>

            {mostrarFormulario && (
                <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-[#12221599] p-5">
                    <section
                        className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-habitacion"
                    >
                        <h2
                            className="mb-3 text-2xl font-medium tracking-tight"
                            id="titulo-habitacion"
                        >
                            {idEdicion ? 'Editar habitación' : 'Nueva habitación'}
                        </h2>
                        <form className="flex flex-col gap-5" onSubmit={guardarHabitacion}>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Número
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    autoFocus
                                    required
                                    maxLength={10}
                                    value={form.numero}
                                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Tipo
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    required
                                    maxLength={40}
                                    placeholder="Ej. Doble · dos camas"
                                    value={form.tipo}
                                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Precio por noche (Q)
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    type="number"
                                    min="0.01"
                                    max="99999999.99"
                                    step="0.01"
                                    required
                                    value={form.precioNoche}
                                    onChange={(e) =>
                                        setForm({ ...form, precioNoche: Number(e.target.value) })
                                    }
                                />
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 border-[#cbd3c3] bg-white! text-[#4d5e42]!"
                                    disabled={guardando}
                                    onClick={() => setMostrarFormulario(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={guardando}
                                >
                                    {guardando ? 'Guardando…' : 'Guardar habitación'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </>
    );
}
