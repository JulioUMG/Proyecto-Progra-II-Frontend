import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// Construye el documento que se usa tanto para visualizar como para descargar.
export function generarPDF(
    titulo: string,
    columnas: string[],
    filas: (string | number)[][],
    filtro: string,
    nota = '',
) {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(11);
    doc.setTextColor(77, 94, 66);
    doc.text('HOTEL RINCÓN HUEHUETECO', 14, 14);
    doc.setFontSize(18);
    doc.text(titulo, 14, 26);
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Generado: ' + new Date().toLocaleString('es-GT') + ' | ' + filtro, 14, 34);
    autoTable(doc, {
        head: [columnas],
        body: filas,
        startY: 40,
        headStyles: { fillColor: [77, 94, 66] },
        alternateRowStyles: { fillColor: [245, 246, 240] },
        styles: { fontSize: 9 },
        margin: { bottom: 20 },
    });
    const paginas = doc.getNumberOfPages();
    for (let pagina = 1; pagina <= paginas; pagina++) {
        doc.setPage(pagina);
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(nota, 245), 14, 197);
        doc.text(`Página ${pagina} de ${paginas}`, 280, 200, { align: 'right' });
    }
    return doc;
}

// Exporta las mismas filas visibles en pantalla a un libro de Excel.
export async function descargarExcel(
    titulo: string,
    columnas: string[],
    filas: (string | number)[][],
    filtro: string,
    nota = '',
) {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet('Reporte');
    hoja.addRow(['HOTEL RINCÓN HUEHUETECO']).font = { bold: true, size: 16 };
    hoja.addRow([titulo]);
    hoja.addRow([filtro]);
    hoja.addRow([nota]);
    hoja.addRow([]);
    const encabezado = hoja.addRow(columnas);
    encabezado.eachCell((celda) => {
        celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4D5E42' } };
    });
    filas.forEach((fila) => hoja.addRow(fila));
    hoja.columns.forEach((columna) => {
        columna.width = 23;
    });
    hoja.views = [{ state: 'frozen', ySplit: 6 }];
    const buffer = await libro.xlsx.writeBuffer();
    const url = URL.createObjectURL(
        new Blob([new Uint8Array(buffer)], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
    );
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = titulo.toLowerCase().replaceAll(' ', '-') + '.xlsx';
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
