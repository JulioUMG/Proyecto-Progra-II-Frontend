import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { iniciarSesion } from '../services/sesionServices';
import { obtenerMensajeError } from '../services/errorServices';
import logo from '../assets/logo-horizontal.png';
import interior from '../assets/hotel/interior.jpg';
import type { Sesion } from '../types/sesion';

// Inicia la sesión del personal y entrega su perfil a la aplicación.
export default function Login({ alIngresar }: { alIngresar: (sesion: Sesion) => void }) {
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const navegar = useNavigate();

    // Valida las credenciales con el servidor y abre el panel.
    async function ingresar(evento: FormEvent) {
        evento.preventDefault();
        setCargando(true);
        setError('');
        try {
            const respuesta = await iniciarSesion(usuario, contrasena);
            alIngresar(respuesta.data);
            navegar('/sistema', { replace: true });
        } catch (error) {
            setError(obtenerMensajeError(error));
        } finally {
            setCargando(false);
        }
    }

    return (
        <main className="grid min-h-screen bg-[#f8f7f3] lg:grid-cols-2">
            <section className="relative hidden overflow-hidden bg-[#263b2c] text-white lg:flex lg:items-end">
                <motion.img
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.4 }}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={interior}
                    alt="Fotografía de referencia de un hotel"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#172a1e]/95 via-[#172a1e]/25 to-transparent" />
                <motion.div
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="relative p-16"
                >
                    <p className="mb-6 text-[10px] tracking-[.25em] text-[#d7dfc9]">
                        HOTEL RINCÓN HUEHUETECO
                    </p>
                    <h1 className="font-serif text-5xl leading-tight">
                        La hospitalidad
                        <br />
                        comienza contigo.
                    </h1>
                    <p className="mt-6 text-sm text-white/70">
                        El descanso y la tradición que te mereces.
                    </p>
                </motion.div>
            </section>
            <motion.section
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mx-auto flex w-full max-w-lg flex-col justify-center px-7 py-12 sm:px-12"
            >
                <Link className="mb-10 text-xs text-[#77836b]" to="/">
                    ← Volver al hotel
                </Link>
                <img className="mb-10 w-72 self-center" src={logo} alt="Hotel Rincón Huehueteco" />
                <p className="mb-3 text-[10px] font-bold tracking-[.2em] text-[#7c886b]">
                    ACCESO DEL PERSONAL
                </p>
                <h2 className="font-serif text-4xl">Bienvenido de nuevo.</h2>
                <p className="mb-8 mt-4 text-sm text-[#7a8175]">
                    Ingresa tus credenciales para continuar.
                </p>
                <form className="flex flex-col gap-5" onSubmit={ingresar}>
                    <label className="flex flex-col gap-2 text-xs font-semibold">
                        Usuario
                        <input
                            className="rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                            autoComplete="username"
                            required
                            maxLength={50}
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold">
                        Contraseña
                        <input
                            className="rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                        />
                    </label>
                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                        >
                            {error}
                        </p>
                    )}
                    <motion.button
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        className="rounded-lg bg-[#4d5e42] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
                        disabled={cargando}
                    >
                        {cargando ? 'Ingresando…' : 'Iniciar sesión →'}
                    </motion.button>
                </form>
                <small className="mt-8 text-[11px] text-[#899080]">
                    Acceso para administración y recepción.
                </small>
            </motion.section>
        </main>
    );
}
