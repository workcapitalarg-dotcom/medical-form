/**
 * API Endpoint: Obtener todos los registros para la vista Asignar Médico (Columna B y Columna BK)
 * Omite las filas 1 y 2 (encabezados) para comenzar desde la fila 3 de datos.
 */

const { getAllRows } = require('./utils/googleSheets');

const SHEET_ID = process.env.SHEET_ID || '1kXhb0zpOzeAxNuYe1PA1HjNPinweRZx9cXD1NozXqHU';
const SHEET_NAME = process.env.SHEET_NAME || 'Respuestas de formulario 1';

module.exports = async function(req, res) {
  try {
    const filas = await getAllRows(SHEET_ID, SHEET_NAME);

    if (!filas || filas.length <= 2) {
      return res.status(200).json({ registros: [], total: 0 });
    }

    // Omitir fila 1 (index 0) y fila 2 (index 1, nombres de columnas). Datos desde fila 3 (index 2).
    const datos = filas.slice(2);
    const registros = [];

    datos.forEach((fila, index) => {
      const numFila = index + 3; // Fila 3 en adelante
      const nombre = fila[1] ? fila[1].toString().trim() : ''; // Columna B (índice 1)
      const controlador = fila[62] ? fila[62].toString().trim() : ''; // Columna BK (índice 62)

      registros.push({
        numFila,
        nombre,
        controlador
      });
    });

    return res.status(200).json({
      registros,
      total: registros.length
    });
  } catch (error) {
    console.error('Error en obtener-trayecto:', error);
    return res.status(500).json({
      error: 'Error al obtener registros de trayecto',
      message: error.message
    });
  }
};
