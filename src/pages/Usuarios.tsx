import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { listarUsuarios, crearUsuario, actualizarUsuario } from '../services/usuarioServices';
import { listarPerfiles } from '../services/perfilServices';
import { obtenerMensajeError } from '../services/errorServices';
import type { Perfil } from '../types/perfil';
import type { Usuario } from '../types/usuario';
import type { Sesion } from '../types/sesion';

const formInicial = {
    nombre: '',
    usuario: '',
    correo: '',
    contrasena: '',
    idPerfil: 0,
    estado: true,
};

// Administra las cuentas del personal y muestra los perfiles existentes.
export default function Usuarios({ sesion }: { sesion: Sesion }) {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [perfiles, setPerfiles] = useState<Perfil[]>([]);
    const [form, setForm] = useState(formInicial);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // Consulta cuentas y perfiles en una sola carga de pantalla.
    async function cargarUsuarios() {
        try {
            const [u, p] = await Promise.all([listarUsuarios(), listarPerfiles()]);
            setUsuarios(u.data);
            setPerfiles(p.data);
            setError('');
        } catch (error) {
            setError(obtenerMensajeError(error));
        } finally {
            setCargando(false);
        }
    }
    // Carga los datos cuando administración abre esta vista.
    useEffect(() => {
        let activo = true;
        Promise.all([listarUsuarios(), listarPerfiles()])
            .then(([u, p]) => {
                if (activo) {
                    setUsuarios(u.data);
                    setPerfiles(p.data);
                }
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

    // Registra una cuenta nueva; el backend cifra su contraseña.
    async function guardarUsuario(evento: FormEvent) {
        evento.preventDefault();
        setGuardando(true);
        try {
            await crearUsuario(form);
            toast.success('Usuario creado');
            setMostrarFormulario(false);
            setForm(formInicial);
            await cargarUsuarios();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setGuardando(false);
        }
    }

    // Activa o desactiva una cuenta distinta de la sesión actual.
    async function cambiarAcceso(usuario: Usuario) {
        setGuardando(true);
        try {
            await actualizarUsuario(usuario.idUsuario, { ...usuario, estado: !usuario.estado });
            toast.success('Acceso actualizado');
            await cargarUsuarios();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setGuardando(false);
        }
    }
    return (
        <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-[#7b8968]">
                        ADMINISTRACIÓN
                    </p>
                    <h1 className="mb-3 text-4xl font-medium tracking-tight">
                        Usuarios y perfiles
                    </h1>
                    <p className="text-sm leading-7 text-[#6a7367]">
                        El equipo que hace posible cada estancia.
                    </p>
                </div>
                <button
                    className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setMostrarFormulario(true)}
                >
                    + Nuevo usuario
                </button>
            </div>
            {error && (
                <p
                    role="alert"
                    className="my-5 rounded-lg border border-[#dce3d2] bg-[#eef2e7] p-4 text-sm text-[#617251] border-red-200! bg-red-50! text-red-800!"
                >
                    {error}
                </p>
            )}
            <div className="my-6 grid gap-5 sm:grid-cols-2">
                {perfiles.map((p) => (
                    <div
                        className="rounded-xl border border-[#dce1d4] bg-[#edf0e5] p-6"
                        key={p.idPerfil}
                    >
                        <strong>{p.nombre}</strong>
                        <p className="text-sm leading-7 text-[#6a7367]">
                            {p.nombre.toLowerCase().includes('admin')
                                ? 'Gestión completa del hotel y del personal.'
                                : 'Reservaciones, huéspedes y operación diaria.'}
                        </p>
                        <span className="inline-flex whitespace-nowrap rounded bg-[#edf1e5] px-2 py-1 text-[9px] font-bold tracking-wide text-[#63784f]">
                            {p.estado ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                    </div>
                ))}
            </div>
            <section className="mb-6 overflow-hidden rounded-xl border border-[#e4e5dc] bg-white overflow-x-auto">
                {cargando ? (
                    <p
                        className="col-span-full p-10 text-center text-sm text-[#7a8175]"
                        role="status"
                    >
                        Cargando usuarios…
                    </p>
                ) : (
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr>
                                <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                    Nombre
                                </th>
                                <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                    Usuario
                                </th>
                                <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                    Correo
                                </th>
                                <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                    Perfil
                                </th>
                                <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                    Estado
                                </th>
                                <th className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]">
                                    Acceso
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((u) => (
                                <tr key={u.idUsuario}>
                                    <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                        {u.nombre}
                                    </td>
                                    <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                        {u.usuario}
                                    </td>
                                    <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                        {u.correo}
                                    </td>
                                    <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                        {perfiles.find((p) => p.idPerfil === u.idPerfil)?.nombre ||
                                            'Sin perfil'}
                                    </td>
                                    <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                        <span className="inline-flex whitespace-nowrap rounded bg-[#edf1e5] px-2 py-1 text-[9px] font-bold tracking-wide text-[#63784f]">
                                            {u.estado ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </td>
                                    <td className="border-t border-[#eef0e9] px-5 py-4 align-middle">
                                        <button
                                            className="rounded-lg border border-[#d7ddcf] bg-[#f6f8f2] px-3 py-2 text-xs font-semibold text-[#4d5e42] transition hover:bg-[#eaf0e0] disabled:opacity-50"
                                            disabled={guardando || u.idUsuario === sesion.idUsuario}
                                            onClick={() => cambiarAcceso(u)}
                                        >
                                            {u.idUsuario === sesion.idUsuario
                                                ? 'Tu sesión'
                                                : u.estado
                                                  ? 'Desactivar'
                                                  : 'Activar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
            {mostrarFormulario && (
                <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-[#12221599] p-5">
                    <section
                        className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-usuario"
                    >
                        <h2
                            className="mb-3 text-2xl font-medium tracking-tight"
                            id="titulo-usuario"
                        >
                            Nuevo usuario
                        </h2>
                        <form className="flex flex-col gap-5" onSubmit={guardarUsuario}>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Nombre
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    autoFocus
                                    required
                                    maxLength={100}
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Usuario
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    required
                                    maxLength={50}
                                    autoComplete="off"
                                    value={form.usuario}
                                    onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Correo
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    required
                                    type="email"
                                    maxLength={100}
                                    value={form.correo}
                                    onChange={(e) => setForm({ ...form, correo: e.target.value })}
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Contraseña
                                <input
                                    className="w-full min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    required
                                    type="password"
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={form.contrasena}
                                    onChange={(e) =>
                                        setForm({ ...form, contrasena: e.target.value })
                                    }
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold">
                                Perfil
                                <select
                                    className="min-w-0 rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    required
                                    value={form.idPerfil || ''}
                                    onChange={(e) =>
                                        setForm({ ...form, idPerfil: Number(e.target.value) })
                                    }
                                >
                                    <option value="">Selecciona un perfil</option>
                                    {perfiles
                                        .filter((p) => p.estado)
                                        .map((p) => (
                                            <option key={p.idPerfil} value={p.idPerfil}>
                                                {p.nombre}
                                            </option>
                                        ))}
                                </select>
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
                                    {guardando ? 'Guardando…' : 'Crear cuenta'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </>
    );
}
