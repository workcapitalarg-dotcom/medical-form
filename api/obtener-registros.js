/**
 * API Endpoint: Obtener registros asignados a un médico
 * Adaptado para Express (req, res)
 */

const { getAllRows } = require('./utils/googleSheets');

const SHEET_ID = process.env.SHEET_ID || '1kXhb0zpOzeAxNuYe1PA1HjNPinweRZx9cXD1NozXqHU';
const SHEET_NAME = process.env.SHEET_NAME || 'Respuestas de formulario 1';

module.exports = async function(req, res) {
  try {
    const medico = req.query.medico;

    if (!medico || medico.trim() === '') {
      return res.status(400).json({ error: 'Parámetro "medico" es requerido' });
    }

    const medicoLimpio = medico.toLowerCase().trim();

    // Obtener todas las filas del Sheet
    const filas = await getAllRows(SHEET_ID, SHEET_NAME);

    if (!filas || filas.length <= 1) {
      return res.status(200).json({ registros: [], total: 0 });
    }

    // Separar header y datos
    const datos = filas.slice(1);

    // Filtrar por médico (columna 62, índice 62 - case insensitive)
    const registrosFiltrados = [];

    datos.forEach((fila, index) => {
      const numFila = index + 2;
      const controlador = fila[62] ? fila[62].toString().toLowerCase().trim() : '';

      // Filtro exacto case-insensitive: nombre completo requerido
      if (controlador === medicoLimpio) {
        registrosFiltrados.push({
          numFila,
          datos: fila,
        });
      }
    });

    return res.status(200).json({
      registros: registrosFiltrados,
      total: registrosFiltrados.length,
      medico: medicoLimpio,
    });
  } catch (error) {
    console.error('Error en obtener-registros:', error);
    return res.status(500).json({
      error: 'Error al obtener registros',
      message: error.message,
    });
  }
};
