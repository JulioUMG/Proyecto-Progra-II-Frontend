import { useState, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { toast } from 'sonner';
import logo from '../assets/logo-horizontal.png';
import exterior from '../assets/hotel/exterior.jpg';
import interior from '../assets/hotel/interior.jpg';
import sencilla from '../assets/habitaciones/sencilla.jpg';
import doble from '../assets/habitaciones/doble.jpg';
import triple from '../assets/habitaciones/triple.jpg';
import restaurante from '../assets/restaurante/restaurante.jpg';
import salon from '../assets/salones/salon.jpg';
import bienestar from '../assets/servicios/bienestar.jpg';
import paisaje from '../assets/actividades/paisaje.jpg';
import cafe from '../assets/actividades/cafe.jpg';
import { consultarDisponibilidad } from '../services/habitacionServices';
import { crearReserva } from '../services/reservacionServices';
import { obtenerMensajeError } from '../services/errorServices';
import { moneda, fechaHoy, sumarDias, contarNoches } from '../services/formatoServices';
import type { Habitacion } from '../types/habitacion';
import type { Confirmacion } from '../types/reservacion';

// Permite buscar habitaciones y enviar una solicitud sin crear una cuenta.
export default function Home({ interna = false }: { interna?: boolean }) {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [entrada, setEntrada] = useState(fechaHoy());
    const [salida, setSalida] = useState(sumarDias(fechaHoy(), 1));
    const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
    const [seleccion, setSeleccion] = useState<number[]>([]);
    const [tipo, setTipo] = useState('Todos');
    const [soloDisponibles, setSoloDisponibles] = useState(true);
    const [consultado, setConsultado] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [huesped, setHuesped] = useState({ nombre: '', dpi: '', telefono: '' });
    const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
    const [listaAnimada] = useAutoAnimate();
    const consultaActual = useRef(0);
    const noches = contarNoches(entrada, salida);
    const elegidas = habitaciones.filter((h) => seleccion.includes(h.idHabitacion));
    const total = elegidas.reduce((suma, h) => suma + Number(h.precioNoche), 0) * noches;
    const visibles = habitaciones.filter(
        (h) =>
            (tipo === 'Todos' || h.tipo === tipo) &&
            (!soloDisponibles || h.disponibilidad === 'DISPONIBLE'),
    );

    // Borra la selección cuando cambian las fechas para evitar reservar con una búsqueda anterior.
    function cambiarFecha(campo: 'entrada' | 'salida', valor: string) {
        consultaActual.current += 1;
        if (campo === 'entrada') {
            setEntrada(valor);
            if (valor >= salida) setSalida(sumarDias(valor, 1));
        } else setSalida(valor);
        setConsultado(false);
        setSeleccion([]);
        setHabitaciones([]);
        setError('');
        setCargando(false);
    }

    // Busca disponibilidad y descarta respuestas de una búsqueda que ya cambió.
    async function buscarHabitaciones(evento: FormEvent) {
        evento.preventDefault();
        const numeroConsulta = ++consultaActual.current;
        setCargando(true);
        setError('');
        setSeleccion([]);
        try {
            const respuesta = await consultarDisponibilidad(entrada, salida);
            if (numeroConsulta !== consultaActual.current) return;
            setHabitaciones(respuesta.data);
            setTipo('Todos');
            setConsultado(true);
        } catch (error) {
            if (numeroConsulta === consultaActual.current) setError(obtenerMensajeError(error));
        } finally {
            if (numeroConsulta === consultaActual.current) setCargando(false);
        }
    }

    // Agrega o quita una habitación de la reserva.
    function seleccionarHabitacion(id: number) {
        setSeleccion((actual) =>
            actual.includes(id) ? actual.filter((numero) => numero !== id) : [...actual, id],
        );
    }

    // Envía los datos; el backend vuelve a validar disponibilidad y calcula el total definitivo.
    async function enviarReserva(evento: FormEvent) {
        evento.preventDefault();
        if (!seleccion.length || guardando) return;
        setGuardando(true);
        setError('');
        try {
            const respuesta = await crearReserva(
                { ...huesped, entrada, salida, habitaciones: seleccion },
                interna,
            );
            setConfirmacion(respuesta.data);
            setSeleccion([]);
            setConsultado(false);
            setHabitaciones([]);
            toast.success('Solicitud registrada correctamente');
        } catch (error) {
            setError(obtenerMensajeError(error));
            toast.error(obtenerMensajeError(error));
        } finally {
            setGuardando(false);
        }
    }

    const enlaces = [
        ['inicio', 'Inicio'],
        ['hotel', 'El hotel'],
        ['habitaciones', 'Habitaciones'],
        ['servicios', 'Servicios'],
        ['restaurante', 'Restaurante'],
        ['salones', 'Salones'],
        ['actividades', 'Actividades'],
        ['contacto', 'Contacto'],
    ];

    // Elige la fotografía según el tipo. Para cambiarlas, reemplaza los JPG en assets/habitaciones.
    function fotoHabitacion(tipo: string) {
        if (tipo.toLowerCase().includes('triple')) return triple;
        if (tipo.toLowerCase().includes('doble')) return doble;
        return sencilla;
    }

    return (
        <div className="min-h-screen bg-[#f8f7f3] text-[#293329]">
            {!interna && (
                <>
                    {/* Encabezado: todos los enlaces llevan a secciones de esta misma página. */}
                    <header className="sticky top-0 z-40 border-b border-[#e4e5dc] bg-white/95 backdrop-blur-md">
                        <div className="mx-auto flex max-w-[1450px] items-center justify-between gap-5 px-5 py-3 lg:px-9">
                            <a href="#inicio" aria-label="Hotel Rincón Huehueteco, inicio">
                                <img
                                    className="h-16 w-52 object-contain sm:w-60"
                                    src={logo}
                                    alt="Hotel Rincón Huehueteco"
                                />
                            </a>
                            <nav
                                className="hidden items-center gap-5 lg:flex"
                                aria-label="Navegación principal"
                            >
                                {enlaces.map(([id, nombre]) => (
                                    <a
                                        className="text-xs text-[#56614f] transition-colors hover:text-[#a78150]"
                                        key={id}
                                        href={'#' + id}
                                    >
                                        {nombre}
                                    </a>
                                ))}
                            </nav>
                            <Link
                                className="hidden rounded-lg border border-[#cbd3c3] px-4 py-3 text-xs font-semibold text-[#4d5e42] lg:block"
                                to="/login"
                            >
                                Personal
                            </Link>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="rounded-lg border border-[#dce1d4] px-3 py-2 text-2xl text-[#4d5e42] lg:hidden"
                                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                                aria-expanded={menuAbierto}
                                aria-controls="menu-publico"
                                onClick={() => setMenuAbierto(!menuAbierto)}
                            >
                                {menuAbierto ? '×' : '☰'}
                            </motion.button>
                        </div>
                        <AnimatePresence>
                            {menuAbierto && (
                                <motion.nav
                                    id="menu-publico"
                                    initial={{ opacity: 0, y: -12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                    className="absolute inset-x-0 top-full max-h-[80svh] overflow-y-auto border-t border-[#e4e5dc] bg-white shadow-xl lg:hidden"
                                    aria-label="Menú móvil"
                                >
                                    <div className="grid grid-cols-2 gap-2 p-5">
                                        {enlaces.map(([id, nombre]) => (
                                            <a
                                                className="rounded-lg px-4 py-3 text-sm hover:bg-[#eef1e7]"
                                                key={id}
                                                href={'#' + id}
                                                onClick={() => setMenuAbierto(false)}
                                            >
                                                {nombre}
                                            </a>
                                        ))}
                                        <Link
                                            className="col-span-2 mt-2 rounded-lg bg-[#4d5e42] px-4 py-3 text-center text-sm text-white"
                                            to="/login"
                                            onClick={() => setMenuAbierto(false)}
                                        >
                                            Acceso del personal ↗
                                        </Link>
                                    </div>
                                </motion.nav>
                            )}
                        </AnimatePresence>
                    </header>

                    {/* Portada con fotografía; Motion anima la entrada del texto. */}
                    <section
                        id="inicio"
                        className="relative isolate flex min-h-[590px] items-center overflow-hidden bg-[#263b2c] sm:min-h-[650px]"
                    >
                        <motion.img
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 -z-20 h-full w-full object-cover"
                            src={exterior}
                            alt="Vista exterior de un hotel, fotografía de referencia"
                            fetchPriority="high"
                        />
                        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#14251c]/90 via-[#182b20]/65 to-black/15" />
                        <motion.div
                            initial={{ opacity: 0, y: 35 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 lg:px-14"
                        >
                            <p className="mb-6 text-[10px] font-semibold tracking-[.3em] text-[#e0d4b7]">
                                HOTEL RINCÓN HUEHUETECO
                            </p>
                            <h1 className="max-w-3xl font-serif text-5xl leading-[1.08] tracking-tight text-white sm:text-7xl lg:text-8xl">
                                Un rincón para
                                <br />
                                <em className="font-normal text-[#e6dfc8]">sentirte en casa.</em>
                            </h1>
                            <p className="mt-7 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
                                El descanso y la tradición que te mereces. Encuentra tu habitación,
                                comparte buenos momentos y disfruta de una estancia a tu ritmo.
                            </p>
                            <div className="mt-9 flex flex-wrap gap-4">
                                <motion.a
                                    whileHover={{ y: -4 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="rounded-lg bg-[#e8dfc7] px-7 py-4 text-sm font-semibold text-[#293329]"
                                    href="#habitaciones"
                                >
                                    Reserva tu estancia →
                                </motion.a>
                                <a
                                    className="rounded-lg border border-white/50 px-7 py-4 text-sm text-white transition-colors hover:bg-white/10"
                                    href="#hotel"
                                >
                                    Conoce el hotel
                                </a>
                            </div>

                        </motion.div>

                    </section>
                    <div className="flex flex-wrap justify-center gap-4 border-b border-[#e1e4d8] bg-[#eeeee4] px-5 py-5 text-[11px] text-[#67735e] sm:gap-12">
                        <span>Entrada desde las 15:00</span>
                        <span>Salida hasta las 12:00</span>
                        <span>Tu estancia comienza aquí</span>
                    </div>

                    {/* Presentación del hotel, dentro de Home. */}
                    <section
                        id="hotel"
                        className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:py-28"
                    >
                        <motion.div
                            initial={{ opacity: 0, x: -35 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.65 }}
                            className="relative"
                        >
                            <img
                                className="h-[350px] w-full rounded-2xl object-cover sm:h-[440px]"
                                src={interior}
                                loading="lazy"
                                alt="Espacios del hotel, imagen de referencia"
                            />
                            <div className="absolute -bottom-5 right-5 rounded-xl bg-[#4d5e42] px-7 py-5 text-center text-white shadow-lg">
                                <span className="block font-serif text-3xl">Bienvenido</span>
                                <span className="text-[10px] tracking-[.15em]">
                                    A TU PRÓXIMO DESCANSO
                                </span>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.65 }}
                        >
                            <p className="mb-5 text-[10px] font-bold tracking-[.22em] text-[#7f895f]">
                                DESCANSO CON IDENTIDAD
                            </p>
                            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
                                Más que una estancia,
                                <br />
                                <em className="text-[#7b8867]">un buen recuerdo.</em>
                            </h2>
                            <p className="mt-6 text-sm leading-8 text-[#6a7367]">
                                Hay viajes que se disfrutan desde que eliges dónde descansar. En
                                Rincón Huehueteco queremos acompañarte con una atención cercana y
                                espacios para compartir.
                            </p>
                            <p className="mt-4 text-sm leading-8 text-[#6a7367]">
                                Explora nuestras habitaciones, conoce los espacios y envía tu
                                solicitud. Recepción te ayudará a preparar los detalles de tu
                                visita.
                            </p>
                            <a
                                className="mt-7 inline-block border-b border-[#879473] pb-2 text-sm font-semibold text-[#4d5e42]"
                                href="#servicios"
                            >
                                Descubre los espacios ↓
                            </a>
                        </motion.div>
                    </section>
                </>
            )}

            {/* La búsqueda y el formulario conservan el flujo conectado al backend. */}
            <main
                id="habitaciones"
                className={'mx-auto max-w-7xl px-5 ' + (interna ? 'py-0' : 'py-16 sm:px-10')}
            >
                <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="mb-3 text-[10px] font-bold tracking-[.2em] text-[#7c886b]">
                            {interna ? 'RECEPCIÓN' : 'TU ESPACIO PARA DESCANSAR'}
                        </p>
                        <h2 className="font-serif text-4xl sm:text-5xl">
                            {interna ? 'Nueva reservación' : 'Elige dónde despertar.'}
                        </h2>
                    </div>
                    <p className="max-w-md text-sm leading-7 text-[#6a7367]">
                        Selecciona tus fechas y una o varias habitaciones.
                        <br />
                        Cada tarifa corresponde a una habitación por noche.
                    </p>
                </div>
                <form
                    className="grid gap-5 rounded-2xl border border-[#e0e4d6] bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_.6fr_1.15fr] lg:items-center"
                    onSubmit={buscarHabitaciones}
                >
                    <label className="flex flex-col gap-2 text-xs font-semibold">
                        Fecha de entrada
                        <input
                            className="w-full rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                            type="date"
                            value={entrada}
                            min={fechaHoy()}
                            required
                            disabled={guardando}
                            onChange={(e) => cambiarFecha('entrada', e.target.value)}
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold">
                        Fecha de salida
                        <input
                            className="w-full rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                            type="date"
                            value={salida}
                            min={sumarDias(entrada || fechaHoy(), 1)}
                            required
                            disabled={guardando}
                            onChange={(e) => cambiarFecha('salida', e.target.value)}
                        />
                    </label>
                    <div className="flex items-center justify-center gap-3 lg:flex-col lg:gap-1">
                        <strong className="font-serif text-3xl font-normal">{noches || '—'}</strong>
                        <span className="text-xs text-[#7a8175]">
                            {noches === 1 ? 'noche de estancia' : 'noches de estancia'}
                        </span>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        className="rounded-lg bg-[#4d5e42] px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#384b30] disabled:opacity-50"
                        disabled={cargando || guardando}
                    >
                        {cargando ? 'Consultando…' : 'Buscar disponibilidad →'}
                    </motion.button>
                </form>
                {error && (
                    <p
                        className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                <AnimatePresence>
                    {confirmacion && (
                        <motion.section
                            initial={{ opacity: 0, y: 25, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="mt-6 rounded-2xl border border-[#cbd8bb] bg-[#edf4e5] p-7"
                            role="status"
                        >
                            <p className="mb-3 text-[10px] font-bold tracking-[.2em] text-[#5e734b]">
                                SOLICITUD RECIBIDA
                            </p>
                            <h3 className="font-serif text-3xl">
                                Tu descanso está un paso más cerca.
                            </h3>
                            <p className="mt-4 text-sm">
                                Reserva <strong>RH-{confirmacion.idReservacion}</strong> · Total:{' '}
                                <strong>{moneda(confirmacion.total)}</strong>
                            </p>
                            <p className="my-4 text-sm leading-7 text-[#64745b]">
                                Está pendiente de aprobación del hotel. Guarda este número para
                                comunicarte con recepción.
                            </p>
                            <button
                                type="button"
                                className="rounded-lg border border-[#a9ba99] bg-white px-5 py-3 text-sm"
                                onClick={() => setConfirmacion(null)}
                            >
                                Entendido
                            </button>
                        </motion.section>
                    )}
                </AnimatePresence>
                {consultado && (
                    <>
                        <div className="my-7 flex flex-wrap items-end gap-5">
                            <label className="flex min-w-48 flex-col gap-2 text-xs font-semibold">
                                Tipo de habitación
                                <select
                                    className="rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                >
                                    <option>Todos</option>
                                    {[...new Set(habitaciones.map((h) => h.tipo))].map((t) => (
                                        <option key={t}>{t}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex items-center gap-2 pb-3 text-sm">
                                <input
                                    className="h-4 w-4 accent-[#4d5e42]"
                                    type="checkbox"
                                    checked={soloDisponibles}
                                    onChange={(e) => setSoloDisponibles(e.target.checked)}
                                />
                                Solo disponibles
                            </label>
                            <p
                                className="pb-3 text-xs text-[#7a8175] sm:ml-auto"
                                aria-live="polite"
                            >
                                {visibles.length} habitaciones · {seleccion.length} seleccionadas
                            </p>
                        </div>
                        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
                            <div ref={listaAnimada} className="grid gap-6 sm:grid-cols-2">
                                {visibles.map((h, indice) => (
                                    <motion.article
                                        key={h.idHabitacion}
                                        initial={{ opacity: 0, y: 25 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.1 }}
                                        transition={{ duration: 0.4, delay: (indice % 2) * 0.08 }}
                                        animate={{
                                            boxShadow: seleccion.includes(h.idHabitacion)
                                                ? '0 0 0 2px #73845e'
                                                : '0 0 0 0px #73845e',
                                        }}
                                        className="overflow-hidden rounded-2xl border border-[#e0e4d6] bg-white"
                                    >
                                        <div className="relative overflow-hidden">
                                            <motion.img
                                                whileHover={{ scale: 1.07 }}
                                                transition={{ duration: 0.6 }}
                                                className="h-56 w-full object-cover"
                                                src={fotoHabitacion(h.tipo)}
                                                loading="lazy"
                                                alt={
                                                    'Fotografía de referencia para la habitación ' +
                                                    h.numero
                                                }
                                            />
                                            <span className="absolute bottom-3 left-3 rounded bg-black/50 px-2 py-1 text-[9px] tracking-wider text-white">
                                                FOTOS DE REFERENCIA
                                            </span>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-[10px] font-semibold tracking-widest text-[#7f895f]">
                                                    HABITACIÓN {h.numero}
                                                </span>
                                                <span className="rounded bg-[#edf1e5] px-2 py-1 text-[9px] font-bold text-[#63784f]">
                                                    {h.disponibilidad}
                                                </span>
                                            </div>
                                            <h3 className="mt-4 font-serif text-2xl">{h.tipo}</h3>
                                            <p className="mt-2 text-xs leading-6 text-[#7a8175]">
                                                Un espacio para disfrutar tu estancia.
                                            </p>
                                            <p className="my-5">
                                                <strong className="text-2xl font-semibold">
                                                    {moneda(Number(h.precioNoche))}
                                                </strong>
                                                <span className="ml-2 text-xs text-[#7a8175]">
                                                    / noche
                                                </span>
                                            </p>
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                className={
                                                    'w-full rounded-lg border px-4 py-3 text-sm font-semibold disabled:opacity-40 ' +
                                                    (seleccion.includes(h.idHabitacion)
                                                        ? 'border-[#4d5e42] bg-[#4d5e42] text-white'
                                                        : 'border-[#cbd3c3] bg-white text-[#4d5e42] hover:bg-[#f0f3e9]')
                                                }
                                                disabled={
                                                    h.disponibilidad !== 'DISPONIBLE' || guardando
                                                }
                                                onClick={() =>
                                                    seleccionarHabitacion(h.idHabitacion)
                                                }
                                            >
                                                {seleccion.includes(h.idHabitacion)
                                                    ? '✓ Seleccionada'
                                                    : h.disponibilidad === 'DISPONIBLE'
                                                        ? 'Seleccionar habitación'
                                                        : 'No disponible'}
                                            </motion.button>
                                        </div>
                                    </motion.article>
                                ))}
                                {!visibles.length && (
                                    <div className="col-span-full rounded-xl bg-white p-10 text-center">
                                        <h3 className="font-serif text-2xl">
                                            No hay habitaciones con estos filtros.
                                        </h3>
                                        <p className="mt-3 text-sm text-[#7a8175]">
                                            Prueba otras fechas o muestra todos los tipos.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <motion.aside
                                id="resumen-reserva"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="scroll-mt-28 rounded-2xl border border-[#dce1d4] bg-white p-6 xl:sticky xl:top-28"
                            >
                                <p className="mb-4 text-[10px] font-bold tracking-[.2em] text-[#7a886a]">
                                    TU ESTANCIA
                                </p>
                                <h3 className="mb-5 font-serif text-3xl">Todo comienza aquí.</h3>
                                {!elegidas.length ? (
                                    <p className="text-sm leading-7 text-[#7a8175]">
                                        Selecciona una habitación para ver el resumen de tu
                                        reservación.
                                    </p>
                                ) : (
                                    <>
                                        <ul>
                                            {elegidas.map((h) => (
                                                <li
                                                    className="flex justify-between gap-3 border-b border-[#e4e5dc] py-3 text-xs"
                                                    key={h.idHabitacion}
                                                >
                                                    <span>Habitación {h.numero}</span>
                                                    <strong>{moneda(Number(h.precioNoche))}</strong>
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="mt-4 text-xs text-[#7a8175]">
                                            {noches} {noches === 1 ? 'noche' : 'noches'} ·{' '}
                                            {elegidas.length}{' '}
                                            {elegidas.length === 1 ? 'habitación' : 'habitaciones'}
                                        </p>
                                        <div className="my-5 border-b border-[#e4e5dc] pb-5">
                                            <p className="text-xs">Total de estancia</p>
                                            <strong className="mt-2 block text-3xl">
                                                {moneda(total)}
                                            </strong>
                                        </div>
                                        <form
                                            className="flex flex-col gap-4"
                                            onSubmit={enviarReserva}
                                        >
                                            <h4 className="text-sm font-semibold">
                                                Datos del huésped
                                            </h4>
                                            <label className="flex flex-col gap-2 text-xs font-semibold">
                                                Nombre completo
                                                <input
                                                    className="rounded-lg border border-[#d5d9ce] p-3 text-sm"
                                                    autoComplete="name"
                                                    required
                                                    minLength={3}
                                                    maxLength={100}
                                                    value={huesped.nombre}
                                                    onChange={(e) =>
                                                        setHuesped({
                                                            ...huesped,
                                                            nombre: e.target.value,
                                                        })
                                                    }
                                                />
                                            </label>
                                            <label className="flex flex-col gap-2 text-xs font-semibold">
                                                DPI
                                                <input
                                                    className="rounded-lg border border-[#d5d9ce] p-3 text-sm"
                                                    required
                                                    inputMode="numeric"
                                                    pattern="[0-9]{13}"
                                                    title="Ingresa los 13 dígitos del DPI"
                                                    maxLength={13}
                                                    value={huesped.dpi}
                                                    onChange={(e) =>
                                                        setHuesped({
                                                            ...huesped,
                                                            dpi: e.target.value,
                                                        })
                                                    }
                                                />
                                            </label>
                                            <label className="flex flex-col gap-2 text-xs font-semibold">
                                                Teléfono
                                                <input
                                                    className="rounded-lg border border-[#d5d9ce] p-3 text-sm"
                                                    type="tel"
                                                    required
                                                    minLength={8}
                                                    maxLength={20}
                                                    value={huesped.telefono}
                                                    onChange={(e) =>
                                                        setHuesped({
                                                            ...huesped,
                                                            telefono: e.target.value,
                                                        })
                                                    }
                                                />
                                            </label>
                                            <p className="text-[11px] leading-6 text-[#7a8175]">
                                                La solicitud necesita aprobación de recepción.
                                            </p>
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                className="rounded-lg bg-[#4d5e42] px-4 py-4 text-sm font-semibold text-white disabled:opacity-50"
                                                disabled={guardando}
                                            >
                                                {guardando
                                                    ? 'Registrando…'
                                                    : 'Solicitar reservación →'}
                                            </motion.button>
                                        </form>
                                    </>
                                )}
                            </motion.aside>
                        </div>
                    </>
                )}
                {!consultado && !confirmacion && (
                    <div className="mt-8 grid gap-6 sm:grid-cols-3">
                        {[
                            [sencilla, 'Sencilla', 'Un descanso a tu medida.'],
                            [doble, 'Doble', 'Comparte tu próxima estancia.'],
                            [triple, 'Triple', 'Más espacio para buenos momentos.'],
                        ].map(([foto, titulo, texto], indice) => (
                            <motion.article
                                key={titulo}
                                initial={{ opacity: 0, y: 35 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.5, delay: indice * 0.1 }}
                                className="overflow-hidden rounded-2xl border border-[#e4e5dc] bg-white"
                            >
                                <div className="overflow-hidden">
                                    <motion.img
                                        whileHover={{ scale: 1.08 }}
                                        transition={{ duration: 0.6 }}
                                        className="h-56 w-full object-cover"
                                        src={foto}
                                        alt={'Habitación de referencia: ' + titulo}
                                        loading="lazy"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="font-serif text-2xl">{titulo}</h3>
                                    <p className="mt-2 text-xs leading-6 text-[#7a8175]">{texto}</p>
                                    <p className="mt-4 text-[10px] text-[#909782]">
                                        Consulta fechas para ver tarifas y disponibilidad.
                                    </p>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}
                {elegidas.length > 0 && consultado && (
                    <a
                        href="#resumen-reserva"
                        className="fixed inset-x-5 bottom-4 z-30 rounded-lg bg-[#4d5e42] px-4 py-4 text-center text-sm font-semibold text-white shadow-xl xl:hidden"
                    >
                        {elegidas.length} seleccionadas · {moneda(total)} · Ver reserva ↑
                    </a>
                )}
            </main>

            {!interna && (
                <>
                    {/* Servicios: textos e imágenes de presentación, fáciles de reemplazar. */}
                    <section id="servicios" className="mt-14 bg-[#edf0e5] px-6 py-20 sm:px-10">
                        <div className="mx-auto max-w-7xl">
                            <motion.div
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="mb-10 max-w-xl"
                            >
                                <p className="mb-4 text-[10px] font-bold tracking-[.2em] text-[#7f895f]">
                                    LOS DETALLES IMPORTAN
                                </p>
                                <h2 className="font-serif text-4xl sm:text-5xl">
                                    Disfruta cada momento.
                                </h2>
                                <p className="mt-5 text-sm leading-7 text-[#6a7367]">
                                    Conoce los espacios y consulta con recepción las opciones
                                    disponibles para complementar tu visita.
                                </p>
                            </motion.div>
                            <div className="grid gap-6 sm:grid-cols-3">
                                {[
                                    [
                                        interior,
                                        'Atención cercana',
                                        'Recepción te acompaña desde tu solicitud hasta la salida.',
                                    ],
                                    [
                                        bienestar,
                                        'Tiempo para ti',
                                        'Consulta las opciones de bienestar y recreación durante tu visita.',
                                    ],
                                    [
                                        exterior,
                                        'Espacios para disfrutar',
                                        'Descubre un lugar donde descansar y compartir.',
                                    ],
                                ].map(([foto, titulo, texto], i) => (
                                    <motion.article
                                        key={titulo}
                                        whileHover={{ y: -7 }}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.45, delay: i * 0.08 }}
                                        className="overflow-hidden rounded-2xl bg-white"
                                    >
                                        <img
                                            className="h-52 w-full object-cover"
                                            src={foto}
                                            alt={'Referencia de ' + titulo.toLowerCase()}
                                            loading="lazy"
                                        />
                                        <div className="p-6">
                                            <h3 className="font-serif text-2xl">{titulo}</h3>
                                            <p className="mt-3 text-xs leading-7 text-[#6a7367]">
                                                {texto}
                                            </p>
                                        </div>
                                    </motion.article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        id="restaurante"
                        className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:gap-20"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <p className="mb-5 text-[10px] font-bold tracking-[.2em] text-[#7f895f]">
                                RESTAURANTE
                            </p>
                            <h2 className="font-serif text-4xl sm:text-5xl">
                                Sabores que invitan
                                <br />a quedarse.
                            </h2>
                            <p className="mt-6 text-sm leading-8 text-[#6a7367]">
                                Una mesa, una buena conversación y tiempo para disfrutar. Conoce la
                                propuesta gastronómica y consulta las opciones para tu estancia.
                            </p>
                            <a
                                className="mt-7 inline-block rounded-lg border border-[#aab79b] px-6 py-3 text-sm font-semibold text-[#4d5e42]"
                                href="#contacto"
                            >
                                Consultar con recepción →
                            </a>
                        </motion.div>
                        <motion.img
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="h-[360px] w-full rounded-2xl object-cover"
                            src={restaurante}
                            loading="lazy"
                            alt="Restaurante, fotografía de referencia"
                        />
                    </section>

                    <section id="salones" className="bg-[#263b2c] px-6 py-20 text-white sm:px-10">
                        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
                            <motion.img
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="h-[360px] w-full rounded-2xl object-cover"
                                src={salon}
                                loading="lazy"
                                alt="Salón de eventos, fotografía de referencia"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <p className="mb-5 text-[10px] font-bold tracking-[.2em] text-[#c4ceaf]">
                                    SALONES Y ENCUENTROS
                                </p>
                                <h2 className="font-serif text-4xl sm:text-5xl">
                                    Los momentos especiales
                                    <br />
                                    <em className="text-[#d9d9bd]">merecen su espacio.</em>
                                </h2>
                                <p className="mt-6 text-sm leading-8 text-white/70">
                                    Celebraciones, reuniones y encuentros. Consulta con recepción la
                                    disponibilidad de espacios y los detalles para organizar tu
                                    evento.
                                </p>
                                <a
                                    className="mt-7 inline-block rounded-lg bg-[#e6dec6] px-6 py-3 text-sm font-semibold text-[#293329]"
                                    href="#contacto"
                                >
                                    Preguntar por un evento →
                                </a>
                            </motion.div>
                        </div>
                    </section>

                    <section id="actividades" className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
                        <motion.div
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-10 text-center"
                        >
                            <p className="mb-4 text-[10px] font-bold tracking-[.2em] text-[#7f895f]">
                                VIVE TU ESTANCIA
                            </p>
                            <h2 className="font-serif text-4xl sm:text-5xl">
                                Haz tiempo para descubrir.
                            </h2>
                            <p className="mt-4 text-sm text-[#6a7367]">
                                Pausa, explora y encuentra una nueva razón para volver.
                            </p>
                        </motion.div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            {[
                                [
                                    paisaje,
                                    'Explora el entorno',
                                    'Consulta recomendaciones para paseos y actividades cercanas.',
                                ],
                                [
                                    cafe,
                                    'Disfruta sin prisa',
                                    'Un café y una buena conversación también son parte del viaje.',
                                ],
                            ].map(([foto, titulo, texto]) => (
                                <motion.article
                                    whileHover={{ y: -6 }}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    key={titulo}
                                    className="overflow-hidden rounded-2xl border border-[#e4e5dc] bg-white"
                                >
                                    <img
                                        className="h-64 w-full object-cover"
                                        src={foto}
                                        loading="lazy"
                                        alt={'Fotografía de referencia: ' + titulo}
                                    />
                                    <div className="p-7">
                                        <h3 className="font-serif text-2xl">{titulo}</h3>
                                        <p className="mt-3 text-sm leading-7 text-[#6a7367]">
                                            {texto}
                                        </p>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </section>

                    <section
                        id="contacto"
                        className="border-t border-[#e1e4d8] bg-[#eeeee4] px-6 py-16 sm:px-10"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8"
                        >
                            <div>
                                <p className="mb-4 text-[10px] font-bold tracking-[.2em] text-[#7f895f]">
                                    SERÁ UN GUSTO RECIBIRTE
                                </p>
                                <h2 className="font-serif text-4xl">Planea tu próxima visita.</h2>
                                <p className="mt-5 text-sm leading-7 text-[#6a7367]">
                                    Ubicación: Universidad Mariano Gálvez.
                                    <br />
                                    Teléfono +502 0000-0000.
                                    <br />
                                    Proyecto Universitario Programacion II
                                    <br />
                                    Entrada: 15:00 · Salida: 12:00.
                                </p>
                            </div>
                            <motion.a
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                className="rounded-lg bg-[#4d5e42] px-8 py-4 text-sm font-semibold text-white"
                                href="#habitaciones"
                            >
                                Consultar habitaciones ↑
                            </motion.a>
                        </motion.div>
                    </section>
                    <footer className="border-t border-[#e1e4d8] bg-white px-6 pb-24 pt-8 sm:px-10">
                        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
                            <img className="w-64" src={logo} alt="Hotel Rincón Huehueteco" />
                            <p className="max-w-lg text-[12px] leading-6 text-[#7a8175]">
                                Derechos Reservados al grupo II Universidad Mariano Galvez de Guatemala, Huehuetenango
                                ©Copyright 2026 || Julio Cordon - Jimmy Kore - Lestes Esnayder
                            </p>
                            <Link className="text-xs text-[#4d5e42]" to="/login">
                                Acceso del personal
                            </Link>
                        </div>
                    </footer>
                </>
            )}
        </div>
    );
}
