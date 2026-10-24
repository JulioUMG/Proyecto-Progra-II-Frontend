import { useEffect, useState, lazy, Suspense } from 'react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Login from './pages/Login';
import Resumen from './pages/Resumen';
import Reservaciones from './pages/Reservaciones';
import Habitaciones from './pages/Habitaciones';
import Huespedes from './pages/Huespedes';
// Los reportes y sus librerías se cargan cuando el personal abre esa pantalla.
const Reportes = lazy(() => import('./pages/Reportes'));
import Usuarios from './pages/Usuarios';
import { NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { toast } from 'sonner';
import simbolo from './assets/simbolo.png';
import { cerrarSesion } from './services/sesionServices';
import { obtenerMensajeError } from './services/errorServices';
import { consultarSesion } from './services/sesionServices';
import type { Sesion } from './types/sesion';

// Define las rutas y comprueba la sesión antes de mostrar el área del personal.
export default function App() {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [saliendo, setSaliendo] = useState(false);
    const [sesion, setSesion] = useState<Sesion | null>(null);
    const [comprobando, setComprobando] = useState(true);

    // Recupera la sesión del servidor al recargar el navegador.
    useEffect(() => {
        let activo = true;
        async function recuperarSesion() {
            try {
                const respuesta = await consultarSesion();
                if (activo) setSesion(respuesta.data);
            } catch {
                if (activo) setSesion(null);
            } finally {
                if (activo) setComprobando(false);
            }
        }
        recuperarSesion();
        return () => {
            activo = false;
        };
    }, []);

    const enlaces = [
        ['', 'Resumen'],
        ['reservaciones', 'Reservaciones'],
        ['nueva', 'Nueva reservación'],
        ['habitaciones', 'Habitaciones'],
        ['huespedes', 'Huéspedes'],
        ['reportes', 'Reportes'],
    ];
    if (sesion?.rol === 'ADMINISTRADOR') enlaces.push(['usuarios', 'Usuarios y perfiles']);

    // Cierra la sesión antes de retirar el acceso a las pantallas del sistema.
    async function salir() {
        setSaliendo(true);
        try {
            await cerrarSesion();
            setSesion(null);
            setMenuAbierto(false);
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setSaliendo(false);
        }
    }

    return (
        <MotionConfig reducedMotion="user">
            <Toaster richColors position="top-right" />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/login"
                    element={
                        sesion ? (
                            <Navigate to="/sistema" replace />
                        ) : (
                            <Login alIngresar={setSesion} />
                        )
                    }
                />
                <Route
                    path="/sistema"
                    element={
                        comprobando ? (
                            <div
                                className="col-span-full p-10 text-center text-sm text-[#7a8175]"
                                role="status"
                            >
                                Comprobando sesión…
                            </div>
                        ) : sesion ? (
                            <div className="min-h-screen bg-[#f8f7f3] text-[#293329]">
                                {/* El menú está aquí para no depender de una carpeta de componentes. */}
                                <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#263b2c] p-6 text-[#e4ebdc] lg:flex">
                                    <Link className="mb-12 flex items-center gap-3" to="/sistema">
                                        <img className="w-11 rounded-lg" src={simbolo} alt="" />
                                        <span className="text-xs leading-6 tracking-wider">
                                            RINCÓN
                                            <br />
                                            <strong>HUEHUETECO</strong>
                                        </span>
                                    </Link>
                                    <p className="mb-5 text-[9px] font-semibold tracking-[.15em] text-[#9fb491]">
                                        GESTIÓN DEL HOTEL
                                    </p>
                                    <nav
                                        className="flex flex-col gap-2"
                                        aria-label="Menú del sistema"
                                    >
                                        {enlaces.map(([ruta, nombre], i) => (
                                            <NavLink
                                                className={({ isActive }) =>
                                                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ' +
                                                    (isActive
                                                        ? 'bg-[#4e6546] text-white'
                                                        : 'text-[#c6d2bc] hover:bg-[#344d38]')
                                                }
                                                end={!ruta}
                                                key={ruta}
                                                to={'/sistema' + (ruta ? '/' + ruta : '')}
                                            >
                                                <span className="text-[9px] opacity-60">
                                                    0{i + 1}
                                                </span>
                                                {nombre}
                                            </NavLink>
                                        ))}
                                    </nav>
                                    <div className="mt-auto flex flex-col gap-3 pt-8">
                                        <span className="text-[9px] tracking-wider text-[#9fb491]">
                                            {sesion.rol}
                                        </span>
                                        <strong className="text-sm">{sesion.nombre}</strong>
                                        <button
                                            className="text-left text-xs text-[#cfdbbf] disabled:opacity-50"
                                            disabled={saliendo}
                                            onClick={salir}
                                        >
                                            {saliendo ? 'Cerrando…' : 'Cerrar sesión ↗'}
                                        </button>
                                        <Link className="mt-3 text-xs text-[#9fb491]" to="/">
                                            Ver página del hotel
                                        </Link>
                                    </div>
                                </aside>
                                <div className="flex min-h-screen min-w-0 flex-col lg:ml-60">
                                    <header className="sticky top-0 z-40 border-b border-[#e4e5dc] bg-white">
                                        <div className="flex min-h-18 items-center justify-between gap-4 px-5 py-4 sm:px-8">
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                className="rounded-lg border border-[#dce1d4] px-3 py-1 text-2xl lg:hidden"
                                                aria-label={
                                                    menuAbierto
                                                        ? 'Cerrar menú del sistema'
                                                        : 'Abrir menú del sistema'
                                                }
                                                aria-expanded={menuAbierto}
                                                aria-controls="menu-sistema-movil"
                                                onClick={() => setMenuAbierto(!menuAbierto)}
                                            >
                                                {menuAbierto ? '×' : '☰'}
                                            </motion.button>
                                            <span className="text-[10px] tracking-widest">
                                                HOTEL RINCÓN HUEHUETECO{' '}
                                                <small className="ml-2 hidden tracking-normal text-[#929b86] sm:inline">
                                                    / Gestión de estancias
                                                </small>
                                            </span>
                                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e7ecdf] text-sm font-bold text-[#4d5e42]">
                                                {sesion.nombre.charAt(0)}
                                            </span>
                                        </div>
                                        <AnimatePresence>
                                            {menuAbierto && (
                                                <motion.nav
                                                    id="menu-sistema-movil"
                                                    initial={{ opacity: 0, y: -12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -12 }}
                                                    className="absolute inset-x-0 top-full max-h-[80svh] overflow-y-auto border-t border-[#e4e5dc] bg-white shadow-xl lg:hidden"
                                                    aria-label="Menú móvil del sistema"
                                                >
                                                    <div className="grid gap-2 p-4 sm:grid-cols-2">
                                                        {enlaces.map(([ruta, nombre]) => (
                                                            <NavLink
                                                                className={({ isActive }) =>
                                                                    'rounded-lg px-4 py-3 text-sm ' +
                                                                    (isActive
                                                                        ? 'bg-[#edf1e5] text-[#4d5e42]'
                                                                        : 'hover:bg-[#f5f7ef]')
                                                                }
                                                                end={!ruta}
                                                                key={ruta}
                                                                to={
                                                                    '/sistema' +
                                                                    (ruta ? '/' + ruta : '')
                                                                }
                                                                onClick={() =>
                                                                    setMenuAbierto(false)
                                                                }
                                                            >
                                                                {nombre}
                                                            </NavLink>
                                                        ))}
                                                        <Link
                                                            className="rounded-lg px-4 py-3 text-sm"
                                                            to="/"
                                                            onClick={() => setMenuAbierto(false)}
                                                        >
                                                            Ver página del hotel ↗
                                                        </Link>
                                                        <button
                                                            className="rounded-lg px-4 py-3 text-left text-sm text-red-700 disabled:opacity-50"
                                                            disabled={saliendo}
                                                            onClick={salir}
                                                        >
                                                            {saliendo
                                                                ? 'Cerrando…'
                                                                : 'Cerrar sesión'}
                                                        </button>
                                                    </div>
                                                </motion.nav>
                                            )}
                                        </AnimatePresence>
                                    </header>
                                    <main className="mx-auto w-full max-w-[1450px] min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
                                        <Outlet />
                                    </main>
                                    <footer className="border-t border-[#e4e5dc] px-5 py-5 text-[10px] text-[#93998b] sm:px-8">
                                        Hotel Rincón Huehueteco · El descanso y la tradición que te
                                        mereces.
                                    </footer>
                                </div>
                            </div>
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                >
                    <Route index element={<Resumen />} />
                    <Route path="reservaciones" element={<Reservaciones />} />
                    <Route path="nueva" element={<Home interna />} />
                    <Route
                        path="habitaciones"
                        element={<Habitaciones administrador={sesion?.rol === 'ADMINISTRADOR'} />}
                    />
                    <Route path="huespedes" element={<Huespedes />} />
                    <Route
                        path="reportes"
                        element={
                            <Suspense
                                fallback={
                                    <p className="text-sm leading-7 text-[#6a7367]" role="status">
                                        Cargando reportes…
                                    </p>
                                }
                            >
                                <Reportes />
                            </Suspense>
                        }
                    />
                    <Route
                        path="usuarios"
                        element={
                            sesion?.rol === 'ADMINISTRADOR' ? (
                                <Usuarios sesion={sesion} />
                            ) : (
                                <Navigate to="/sistema" replace />
                            )
                        }
                    />
                </Route>
                <Route
                    path="*"
                    element={
                        <main className="col-span-full p-10 text-center text-sm text-[#7a8175]">
                            <h1 className="mb-3 text-4xl font-medium tracking-tight">
                                Esta página no existe.
                            </h1>
                            <Link
                                className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#4d5e42] bg-[#4d5e42] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                                to="/"
                            >
                                Volver al hotel
                            </Link>
                        </main>
                    }
                />
            </Routes>
        </MotionConfig>
    );
}
