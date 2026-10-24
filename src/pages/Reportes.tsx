import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { listarReservas } from '../services/reservacionServices';
import { listarHuespedes } from '../services/huespedServices';
import { listarHabitaciones } from '../services/habitacionServices';
import { obtenerMensajeError } from '../services/errorServices';
import { descargarExcel, generarPDF } from '../services/reporteServices';
import { moneda, fechaCorta, contarNoches } from '../services/formatoServices';
import type { Reserva } from '../types/reservacion';
import type { Habitacion } from '../types/habitacion';
import type { Huesped } from '../types/huesped';

const COLORES = ['#4d5e42', '#b58b5c', '#8d9e7e', '#d5be9c', '#a25d4e', '#6f8093'];

// Reúne los tres reportes; la tabla, las gráficas y los archivos utilizan los mismos filtros.
export default function Reportes() {
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [huespedes, setHuespedes] = useState<Huesped[]>([]);
    const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
    const [tipoReporte, setTipoReporte] = useState('reservaciones');
    const [busqueda, setBusqueda] = useState('');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [estado, setEstado] = useState('TODOS');
    const [tipoHabitacion, setTipoHabitacion] = useState('Todos');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [exportando, setExportando] = useState(false);

    // Carga las tres fuentes para poder cambiar de reporte sin consultar cada vez.
    useEffect(() => {
        let activo = true;
        async function cargarReportes() {
            try {
                const [r, h, c] = await Promise.all([
                    listarReservas(),
                    listarHabitaciones(),
                    listarHuespedes(),
                ]);
                if (activo) {
                    setReservas(r.data);
                    setHabitaciones(h.data);
                    setHuespedes(c.data);
                }
            } catch (error) {
                if (activo) setError(obtenerMensajeError(error));
            } finally {
                if (activo) setCargando(false);
            }
        }
        cargarReportes();
        return () => {
            activo = false;
        };
    }, []);

    // Limpia los filtros para no arrastrar estados de un reporte a otro.
    function cambiarReporte(tipo: string) {
        setTipoReporte(tipo);
        limpiarFiltros();
    }

    // Devuelve el reporte a su listado completo.
    function limpiarFiltros() {
        setBusqueda('');
        setDesde('');
        setHasta('');
        setEstado('TODOS');
        setTipoHabitacion('Todos');
    }

    const intervaloValido = !desde || !hasta || desde <= hasta;
    const texto = busqueda.trim().toLowerCase();
    const reservasFiltradas = intervaloValido
        ? reservas.filter(
            (r) =>
                (!desde || r.fechaIngreso.slice(0, 10) >= desde) &&
                (!hasta || r.fechaIngreso.slice(0, 10) <= hasta) &&
                (estado === 'TODOS' || r.estadoReservacion === estado) &&
                `${r.idReservacion} ${r.nombre} ${r.dpi} ${r.habitaciones.join(' ')}`
                    .toLowerCase()
                    .includes(texto),
        )
        : [];
    const clientesFiltrados = huespedes.filter(
        (h) =>
            (estado === 'TODOS' || (h.estado ? 'ACTIVO' : 'INACTIVO') === estado) &&
            `${h.nombre} ${h.dpi} ${h.telefono}`.toLowerCase().includes(texto),
    );
    const habitacionesFiltradas = habitaciones.filter(
        (h) =>
            (estado === 'TODOS' || h.estadoHabitacion === estado) &&
            (tipoHabitacion === 'Todos' || h.tipo === tipoHabitacion) &&
            `${h.numero} ${h.tipo}`.toLowerCase().includes(texto),
    );

    let titulo: string;
    let columnas: string[];
    let filas: (string | number)[][];
    let barras: { nombre: string; cantidad: number }[];
    let pastel: { nombre: string; cantidad: number }[];
    let indicadores: { nombre: string; valor: string | number; detalle: string }[];
    let tituloBarras: string;
    let tituloPastel: string;
    let estados: string[];

    // Prepara los encabezados y filas de reservaciones, igual que el ejemplo de clase.
    if (tipoReporte === 'reservaciones') {
        titulo = 'Reporte de reservaciones';
        columnas = [
            'Reserva',
            'Huésped',
            'Habitaciones',
            'Entrada',
            'Salida',
            'Estado',
            'Total (Q)',
        ];
        filas = reservasFiltradas.map((r) => [
            `RH-${r.idReservacion}`,
            r.nombre,
            r.habitaciones.join(', '),
            fechaCorta(r.fechaIngreso),
            fechaCorta(r.fechaSalida),
            r.estadoReservacion,
            Number(r.total),
        ]);
        estados = ['PENDIENTE', 'CONFIRMADA', 'HOSPEDADO', 'FINALIZADA', 'CANCELADA', 'RECHAZADA'];
        barras = [...new Set(reservasFiltradas.map((r) => r.fechaIngreso.slice(0, 7)))]
            .sort()
            .map((mes) => ({
                nombre: mes,
                cantidad: reservasFiltradas.filter((r) => r.fechaIngreso.startsWith(mes)).length,
            }));
        pastel = [...new Set(reservasFiltradas.map((r) => r.estadoReservacion))].map((e) => ({
            nombre: e,
            cantidad: reservasFiltradas.filter((r) => r.estadoReservacion === e).length,
        }));
        const vigentes = reservasFiltradas.filter((r) =>
            ['CONFIRMADA', 'HOSPEDADO', 'FINALIZADA'].includes(r.estadoReservacion),
        );
        indicadores = [
            { nombre: 'Reservaciones', valor: filas.length, detalle: 'Dentro del filtro' },
            {
                nombre: 'Importe estimado',
                valor: moneda(vigentes.reduce((suma, r) => suma + Number(r.total), 0)),
                detalle: 'Confirmadas, hospedadas y finalizadas',
            },
            {
                nombre: 'Noches reservadas',
                valor: vigentes.reduce(
                    (suma, r) =>
                        suma +
                        contarNoches(r.fechaIngreso.slice(0, 10), r.fechaSalida.slice(0, 10)) *
                        r.habitaciones.length,
                    0,
                ),
                detalle: 'Noches por habitaciones',
            },
        ];
        tituloBarras = 'Reservaciones por mes de entrada';
        tituloPastel = 'Estado de las reservaciones';
    } else if (tipoReporte === 'clientes') {
        titulo = 'Reporte de huéspedes';
        columnas = ['Nombre', 'DPI', 'Teléfono', 'Estado', 'Reservaciones'];
        filas = clientesFiltrados.map((h) => [
            h.nombre,
            h.dpi,
            h.telefono,
            h.estado ? 'ACTIVO' : 'INACTIVO',
            reservas.filter((r) => r.dpi === h.dpi).length,
        ]);
        estados = ['ACTIVO', 'INACTIVO'];
        barras = clientesFiltrados.map((h) => ({
            nombre: h.nombre,
            cantidad: reservas.filter((r) => r.dpi === h.dpi).length,
        }));
        pastel = estados
            .map((e) => ({
                nombre: e,
                cantidad: clientesFiltrados.filter((h) => (h.estado ? 'ACTIVO' : 'INACTIVO') === e)
                    .length,
            }))
            .filter((d) => d.cantidad > 0);
        indicadores = [
            { nombre: 'Huéspedes', valor: filas.length, detalle: 'Fichas dentro del filtro' },
            {
                nombre: 'Activos',
                valor: clientesFiltrados.filter((h) => h.estado).length,
                detalle: 'Fichas habilitadas',
            },
            {
                nombre: 'Reservaciones asociadas',
                valor: reservas.filter((r) => clientesFiltrados.some((h) => h.dpi === r.dpi))
                    .length,
                detalle: 'Incluye el historial completo',
            },
        ];
        tituloBarras = 'Reservaciones por huésped';
        tituloPastel = 'Estado de los huéspedes';
    } else {
        titulo = 'Reporte de habitaciones';
        columnas = ['Número', 'Tipo', 'Tarifa por noche (Q)', 'Estado operativo', 'Registro'];
        filas = habitacionesFiltradas.map((h) => [
            h.numero,
            h.tipo,
            Number(h.precioNoche),
            h.estadoHabitacion,
            h.estado ? 'ACTIVO' : 'INACTIVO',
        ]);
        estados = ['DISPONIBLE', 'OCUPADA', 'LIMPIEZA', 'MANTENIMIENTO'];
        barras = [...new Set(habitacionesFiltradas.map((h) => h.tipo))].map((tipo) => ({
            nombre: tipo,
            cantidad: habitacionesFiltradas.filter((h) => h.tipo === tipo).length,
        }));
        pastel = estados
            .map((e) => ({
                nombre: e,
                cantidad: habitacionesFiltradas.filter((h) => h.estadoHabitacion === e).length,
            }))
            .filter((d) => d.cantidad > 0);
        const promedio = filas.length
            ? habitacionesFiltradas.reduce((suma, h) => suma + Number(h.precioNoche), 0) /
            filas.length
            : 0;
        indicadores = [
            { nombre: 'Habitaciones', valor: filas.length, detalle: 'Dentro del filtro' },
            {
                nombre: 'Listas para uso',
                valor: habitacionesFiltradas.filter(
                    (h) => h.estado && h.estadoHabitacion === 'DISPONIBLE',
                ).length,
                detalle: 'Estado operativo actual',
            },
            {
                nombre: 'Tarifa promedio',
                valor: moneda(promedio),
                detalle: 'Precio por noche del listado',
            },
        ];
        tituloBarras = 'Habitaciones por tipo';
        tituloPastel = 'Estado operativo';
    }
    const filtro =
        `Búsqueda: ${busqueda || 'todas'} | Estado: ${estado}` +
        (tipoReporte === 'reservaciones'
            ? ` | Entrada: ${desde || 'sin límite'} al ${hasta || 'sin límite'}`
            : tipoReporte === 'habitaciones'
                ? ` | Tipo: ${tipoHabitacion}`
                : '');

    // Usa el mismo documento para vista previa y descarga del reporte seleccionado.
    function exportarPDF(previsualizar: boolean) {
        try {
            const documento = generarPDF(titulo, columnas, filas, filtro);
            if (previsualizar) {
                const url = URL.createObjectURL(documento.output('blob'));
                if (!window.open(url, '_blank'))
                    toast.error('Permite abrir pestañas para visualizar el PDF.');
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            } else documento.save(tipoReporte + '-hotel.pdf');
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        }
    }

    // Exporta exactamente las filas visibles del reporte actual.
    async function exportarExcel() {
        setExportando(true);
        try {
            await descargarExcel(titulo, columnas, filas, filtro);
            toast.success('Reporte exportado');
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setExportando(false);
        }
    }

    return (
        <>
            <div className="mb-8">
                <p className="mb-3 text-[10px] font-bold tracking-[.2em] text-[#7c886b]">
                    INFORMACIÓN PARA DECIDIR
                </p>
                <h1 className="text-4xl font-medium tracking-tight">Reportes</h1>
                <p className="mt-3 text-sm text-[#6a7367]">
                    Consulta, filtra y exporta la información del hotel.
                </p>
            </div>
            <div className="mb-6 flex flex-wrap gap-3" role="group" aria-label="Tipo de reporte">
                {[
                    ['reservaciones', 'Reservaciones'],
                    ['clientes', 'Huéspedes / clientes'],
                    ['habitaciones', 'Habitaciones'],
                ].map(([tipo, nombre]) => (
                    <motion.button
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.96 }}
                        key={tipo}
                        aria-pressed={tipoReporte === tipo}
                        className={
                            'rounded-lg border px-5 py-3 text-sm font-semibold ' +
                            (tipoReporte === tipo
                                ? 'border-[#4d5e42] bg-[#4d5e42] text-white'
                                : 'border-[#dce1d4] bg-white text-[#4d5e42]')
                        }
                        onClick={() => cambiarReporte(tipo)}
                    >
                        {nombre}
                    </motion.button>
                ))}
            </div>
            <div className="mb-7 flex flex-wrap items-end gap-4 rounded-xl border border-[#e0e4d6] bg-white p-5">
                <label className="flex min-w-40 flex-1 flex-col gap-2 text-xs font-semibold">
                    Buscar
                    <input
                        className="rounded-lg border border-[#d5d9ce] p-3 text-sm"
                        type="search"
                        placeholder={
                            tipoReporte === 'clientes'
                                ? 'Nombre, DPI o teléfono'
                                : tipoReporte === 'habitaciones'
                                    ? 'Número o tipo'
                                    : 'Reserva, huésped o habitación'
                        }
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </label>
                <label className="flex min-w-36 flex-col gap-2 text-xs font-semibold">
                    Estado
                    <select
                        className="rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                    >
                        <option>TODOS</option>
                        {estados.map((e) => (
                            <option key={e}>{e}</option>
                        ))}
                    </select>
                </label>
                {tipoReporte === 'reservaciones' && (
                    <>
                        <label className="flex flex-col gap-2 text-xs font-semibold">
                            Entrada desde
                            <input
                                className="rounded-lg border border-[#d5d9ce] p-3 text-sm"
                                type="date"
                                value={desde}
                                onChange={(e) => setDesde(e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold">
                            Entrada hasta
                            <input
                                className="rounded-lg border border-[#d5d9ce] p-3 text-sm"
                                type="date"
                                min={desde}
                                value={hasta}
                                onChange={(e) => setHasta(e.target.value)}
                            />
                        </label>
                    </>
                )}
                {tipoReporte === 'habitaciones' && (
                    <label className="flex flex-col gap-2 text-xs font-semibold">
                        Tipo
                        <select
                            className="rounded-lg border border-[#d5d9ce] bg-white p-3 text-sm"
                            value={tipoHabitacion}
                            onChange={(e) => setTipoHabitacion(e.target.value)}
                        >
                            <option>Todos</option>
                            {[...new Set(habitaciones.map((h) => h.tipo))].map((t) => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </label>
                )}
                <button
                    className="rounded-lg border border-[#cbd3c3] px-4 py-3 text-sm text-[#4d5e42]"
                    onClick={limpiarFiltros}
                >
                    Limpiar filtros
                </button>
            </div>
            {error && (
                <p className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
                    {error}
                </p>
            )}
            {tipoReporte === 'reservaciones' && !intervaloValido && (
                <p className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
                    Revisa el intervalo de fechas.
                </p>
            )}
            {cargando ? (
                <p className="text-sm leading-7 text-[#6a7367]" role="status">
                    Cargando reportes…
                </p>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tipoReporte}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="mb-6 grid gap-4 sm:grid-cols-3">
                            {indicadores.map((i) => (
                                <article
                                    key={i.nombre}
                                    className="rounded-xl border border-[#e0e4d6] bg-white p-6"
                                >
                                    <p className="text-xs text-[#6a7367]">{i.nombre}</p>
                                    <strong className="my-4 block break-words text-3xl font-medium">
                                        {i.valor}
                                    </strong>
                                    <small className="text-[11px] text-[#8b9380]">
                                        {i.detalle}
                                    </small>
                                </article>
                            ))}
                        </div>
                        <p className="mb-6 rounded-lg bg-[#edf1e5] p-4 text-xs leading-6 text-[#647356]">

                        </p>
                        <div className="mb-6 grid gap-5 lg:grid-cols-2">
                            <section className="min-w-0 rounded-xl border border-[#e0e4d6] bg-white p-5">
                                <h2 className="mb-5 text-lg font-medium">{tituloBarras}</h2>
                                {filas.length ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={barras}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar
                                                dataKey="cantidad"
                                                fill="#4d5e42"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="py-20 text-center text-sm text-[#7a8175]">
                                        Sin datos para graficar.
                                    </p>
                                )}
                            </section>
                            <section className="min-w-0 rounded-xl border border-[#e0e4d6] bg-white p-5">
                                <h2 className="mb-5 text-lg font-medium">{tituloPastel}</h2>
                                {filas.length ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={pastel}
                                                dataKey="cantidad"
                                                nameKey="nombre"
                                                innerRadius={55}
                                                outerRadius={85}
                                            >
                                                {pastel.map((d, i) => (
                                                    <Cell
                                                        key={d.nombre}
                                                        fill={COLORES[i % COLORES.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="py-20 text-center text-sm text-[#7a8175]">
                                        Sin datos para graficar.
                                    </p>
                                )}
                            </section>
                        </div>
                        <section className="overflow-hidden rounded-xl border border-[#e0e4d6] bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e4e5dc] p-5">
                                <div>
                                    <h2 className="text-xl font-medium">{titulo}</h2>
                                    <p className="mt-2 text-xs text-[#7a8175]">
                                        {filas.length} registros · Los archivos incluyen estas
                                        mismas filas.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className="rounded-lg border border-[#cbd3c3] px-3 py-2 text-xs font-semibold text-[#4d5e42] disabled:opacity-40"
                                        disabled={!filas.length || exportando}
                                        onClick={() => exportarPDF(true)}
                                    >
                                        Ver PDF
                                    </button>
                                    <button
                                        className="rounded-lg border border-[#cbd3c3] px-3 py-2 text-xs font-semibold text-[#4d5e42] disabled:opacity-40"
                                        disabled={!filas.length || exportando}
                                        onClick={() => exportarPDF(false)}
                                    >
                                        Descargar PDF
                                    </button>
                                    <button
                                        className="rounded-lg bg-[#4d5e42] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                                        disabled={!filas.length || exportando}
                                        onClick={exportarExcel}
                                    >
                                        {exportando ? 'Generando…' : 'Exportar Excel'}
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr>
                                            {columnas.map((c) => (
                                                <th
                                                    className="whitespace-nowrap bg-[#f3f5ee] px-5 py-4 text-[10px] font-semibold text-[#7a856f]"
                                                    key={c}
                                                >
                                                    {c}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filas.map((fila, i) => (
                                            <tr key={i}>
                                                {fila.map((valor, j) => (
                                                    <td
                                                        className="border-t border-[#eef0e9] px-5 py-4"
                                                        key={j}
                                                    >
                                                        {valor}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!filas.length && (
                                    <p className="p-10 text-center text-sm text-[#7a8175]">
                                        No hay registros con estos filtros.
                                    </p>
                                )}
                            </div>
                        </section>
                    </motion.div>
                </AnimatePresence>
            )}
        </>
    );
}
