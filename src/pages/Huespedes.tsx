import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { listarHuespedes, actualizarHuesped } from '../services/huespedServices';
import { obtenerMensajeError } from '../services/errorServices';
import type { Huesped } from '../types/huesped';

// Consulta las fichas de huéspedes y permite corregir sus datos en recepción.
export default function Huespedes() {
    const [huespedes, setHuespedes] = useState<Huesped[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [form, setForm] = useState<Huesped | null>(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // Recarga los huéspedes después de una corrección.
    async function cargarHuespedes() {
        try {
            setHuespedes((await listarHuespedes()).data);
            setError('');
        } catch (error) {
            setError(obtenerMensajeError(error));
        } finally {
            setCargando(false);
        }
    }
    // Consulta el listado al abrir la pantalla.
    useEffect(() => {
        let activo = true;
        // Ignora la respuesta si el usuario ya salió de esta pantalla.
        listarHuespedes()
            .then((respuesta) => {
                if (activo) setHuespedes(respuesta.data);
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

    // Envía los datos corregidos de la ficha seleccionada.
    async function guardarHuesped(evento: FormEvent) {
        evento.preventDefault();
        if (!form) return;
        setGuardando(true);
        try {
            await actualizarHuesped(form.idHuesped, form);
            toast.success('Datos del huésped actualizados');
            setForm(null);
            await cargarHuespedes();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setGuardando(false);
        }
    }
    const visibles = huespedes.filter((h) =>
        `${h.nombre} ${h.dpi} ${h.telefono}`.toLowerCase().includes(busqueda.toLowerCase()),
    );
    return (
        <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-[#7b8968]">
                        PERSONAS QUE NOS VISITAN
                    </p>
                    <h1 className="mb-3 text-4xl font-medium tracking-tight">Huéspedes</h1>
                    <p className="text-sm leading-7 text-[#6a7367]">
                        La información necesaria para una atención cercana.
                    </p>
                </div>
            </div>
            <div className="my-6 flex flex-wrap items-end gap-4">
                <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                    Buscar huésped
                    <input
                        className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                        type="search"
                        placeholder="Nombre, DPI o teléfono"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </label>
                <p className="text-sm leading-7 text-[#6a7367]">{visibles.length} registros</p>
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
                        Cargando huéspedes…
                    </p>
                ) : (
                    <>
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Nombre
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        DPI
                                    </th>
                                    <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                        Teléfono
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
                                {visibles.map((h) => (
                                    <tr key={h.idHuesped}>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <strong>{h.nombre}</strong>
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            {h.dpi}
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            {h.telefono}
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <span className="inline-flex whitespace-nowrap rounded bg-[#edf1e5] px-2 py-1 text-[9px] font-bold tracking-wide text-[#63784f]">
                                                {h.estado ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                            <button
                                                className="rounded-lg border border-[#d7ddcf] bg-[#f6f8f2] px-3 py-2 text-xs font-semibold text-[#4d5e42] transition hover:bg-[#eaf0e0] disabled:opacity-50"
                                                onClick={() => setForm({ ...h })}
                                            >
                                                Editar ficha
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!visibles.length && (
                            <p className="col-span-full p-10 text-center text-sm text-[#7a8175]">
                                No hay huéspedes con esta búsqueda. Las fichas se crean al registrar
                                una reserva.
                            </p>
                        )}
                    </>
                )}
            </div>
            {form && (
                <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-[#12221599] p-5">
                    <section
                        className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-huesped"
                    >
                        <h2
                            className="mb-3 text-2xl font-medium tracking-tight"
                            id="titulo-huesped"
                        >
                            Editar huésped
                        </h2>
                        <form className="flex flex-col gap-5" onSubmit={guardarHuesped}>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Nombre
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    autoFocus
                                    required
                                    minLength={3}
                                    maxLength={100}
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                DPI
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    required
                                    pattern="[0-9]{13}"
                                    maxLength={13}
                                    value={form.dpi}
                                    onChange={(e) => setForm({ ...form, dpi: e.target.value })}
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Teléfono
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    required
                                    minLength={8}
                                    maxLength={20}
                                    value={form.telefono}
                                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                />
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 border-[#cbd3c3] bg-white! text-[#4d5e42]!"
                                    disabled={guardando}
                                    onClick={() => setForm(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={guardando}
                                >
                                    {guardando ? 'Guardando…' : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </>
    );
}
