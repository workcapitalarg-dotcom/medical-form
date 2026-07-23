/**
 * API Endpoint: Actualizar únicamente la columna BK (Controlador) para una fila específica
 */

const { updateRangeValues } = require('./utils/googleSheets');

const SHEET_ID = process.env.SHEET_ID || '1kXhb0zpOzeAxNuYe1PA1HjNPinweRZx9cXD1NozXqHU';
const SHEET_NAME = process.env.SHEET_NAME || 'Respuestas de formulario 1';

const MEDICOS_PERMITIDOS = ['mercedes', 'meloni', 'claudia', 'zanoni', 'alvo'];
const MEDICOS_MAP = {
  'mercedes': 'Mercedes',
  'meloni': 'Meloni',
  'claudia': 'Claudia',
  'zanoni': 'Zanoni',
  'alvo': 'Alvo'
};

module.exports = async function(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { numFila, controlador } = req.body;

    const parsedFila = parseInt(numFila, 10);
    if (isNaN(parsedFila)) {
      return res.status(400).json({ error: 'numFila es requerido y debe ser un número válido' });
    }

    if (parsedFila < 3) {
      return res.status(400).json({ error: 'numFila debe ser mayor o igual a 3 (la fila 2 contiene los nombres de columna)' });
    }

    const inputRaw = controlador !== undefined && controlador !== null ? controlador.toString().trim() : '';
    let valorControlador = '';

    if (inputRaw !== '') {
      const lower = inputRaw.toLowerCase();
      if (!MEDICOS_PERMITIDOS.includes(lower)) {
        return res.status(400).json({
          error: 'Controlador no permitido. Los médicos permitidos son: Mercedes, Meloni, Claudia, Zanoni, Alvo'
        });
      }
      valorControlador = MEDICOS_MAP[lower];
    }

    // Escribir celda BK{numFila}
    const range = `${SHEET_NAME}!BK${parsedFila}`;
    await updateRangeValues(SHEET_ID, range, [[valorControlador]]);

    console.log(`[Backend API] Fila ${parsedFila} actualizada -> Columna BK: "${valorControlador}"`);

    return res.status(200).json({
      exito: true,
      numFila: parsedFila,
      controlador: valorControlador,
      mensaje: `Fila ${parsedFila} actualizada correctamente`
    });
  } catch (error) {
    console.error('Error en actualizar-controlador:', error);
    return res.status(500).json({
      error: 'Error al actualizar el controlador',
      message: error.message
    });
  }
};
