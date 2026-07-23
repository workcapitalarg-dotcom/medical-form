/**
 * API Endpoint: Obtener todos los registros para la vista Trayecto (Columna B y Columna BK)
 */

const { getAllRows } = require('./utils/googleSheets');

const SHEET_ID = process.env.SHEET_ID || '1kXhb0zpOzeAxNuYe1PA1HjNPinweRZx9cXD1NozXqHU';
const SHEET_NAME = process.env.SHEET_NAME || 'Respuestas de formulario 1';

module.exports = async function(req, res) {
  try {
    const filas = await getAllRows(SHEET_ID, SHEET_NAME);

    if (!filas || filas.length <= 1) {
      return res.status(200).json({ registros: [], total: 0 });
    }

    // Datos desde fila 2 (índice 1 en array)
    const datos = filas.slice(1);
    const registros = [];

    datos.forEach((fila, index) => {
      const numFila = index + 2;
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
