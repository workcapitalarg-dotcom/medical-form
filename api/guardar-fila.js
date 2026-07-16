/**
 * API Endpoint: Guardar fila con procesamiento del cerebro médico
 * Adaptado para Express (req, res)
 */

const { updateRangeValues } = require('./utils/googleSheets');
const { procesarCerebroMedico } = require('./cerebroMedico');

const SHEET_ID = process.env.SHEET_ID || '1kXhb0zpOzeAxNuYe1PA1HjNPinweRZx9cXD1NozXqHU';
const SHEET_NAME = process.env.SHEET_NAME || 'Respuestas de formulario 1';

module.exports = async function(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { numFila, datos } = req.body;

    // Validaciones
    if (!numFila || !datos) {
      return res.status(400).json({ error: 'numFila y datos son requeridos' });
    }

    if (!Array.isArray(datos) || datos.length !== 63) {
      return res.status(400).json({ error: 'datos debe ser un array de 63 columnas' });
    }

    // 1. NORMALIZAR DATOS (convertir fechas y objetos a strings)
    const datosNormalizados = datos.map((campo) => {
      if (campo === null || campo === undefined) return '';
      if (campo instanceof Date) return campo.toLocaleString('es-AR');
      if (typeof campo === 'object') return JSON.stringify(campo);
      return campo.toString();
    });

    // 2. LEER DATOS ACTUALES DEL SHEET PARA PRESERVAR CAMPOS NO EDITADOS
    const { getRangeValues } = require('./utils/googleSheets');
    const rangeLectura = `${SHEET_NAME}!A${numFila}:BM${numFila}`;
    let datosExistentes = [];
    try {
      const existentes = await getRangeValues(SHEET_ID, rangeLectura);
      if (existentes && existentes.length > 0) {
        datosExistentes = existentes[0];
        // Rellenar si hay menos columnas
        while (datosExistentes.length < 63) datosExistentes.push('');
      }
    } catch (e) {
      console.warn('No se pudieron leer datos existentes, se usarán los enviados');
    }

    // 3. PROCESAR CON EL CEREBRO MÉDICO
    const resultados = procesarCerebroMedico(datosNormalizados);
    console.log(`[Backend] Fila ${numFila} procesada. Riesgo: ${resultados.riesgo} | Motivos: ${resultados.motivo}`);

    // 4. INTEGRAR RESULTADOS EN EL ARRAY DE DATOS
    const datosActualizados = [...datosNormalizados];
    datosActualizados[2] = resultados.edadLimpia;
    datosActualizados[3] = resultados.etapa;
    datosActualizados[4] = resultados.dniLimpio;
    datosActualizados[13] = resultados.imcNum;
    datosActualizados[14] = resultados.imcTexto;
    datosActualizados[60] = resultados.riesgo;
    datosActualizados[61] = resultados.motivo;

    // 5. PRESERVAR CAMPOS CALCULADOS POR CEREBRO MÉDICO
    // Estos campos se calculan automáticamente y NUNCA deben quedar vacíos
    const camposCalculados = [2, 3, 13, 14, 60, 61];
    for (const idx of camposCalculados) {
      if (datosActualizados[idx] === '' && datosExistentes[idx] && datosExistentes[idx] !== '') {
        datosActualizados[idx] = datosExistentes[idx];
      }
    }

    // PRESERVAR SOLO EL TIMESTAMP (col 0) - todos los demás campos son editables en el formulario
    const camposSinInput = [0];
    for (const idx of camposSinInput) {
      if (datosActualizados[idx] === '' && datosExistentes[idx] && datosExistentes[idx] !== '') {
        datosActualizados[idx] = datosExistentes[idx];
      }
    }

    // 6. ESCRIBIR EN EL SHEET
    const range = `${SHEET_NAME}!A${numFila}:BM${numFila}`;

    await updateRangeValues(SHEET_ID, range, [datosActualizados]);

    return res.status(200).json({
      exito: true,
      numFila,
      resultados,
      datosActualizados: datosActualizados,
      mensaje: `Fila ${numFila} guardada exitosamente`,
    });
  } catch (error) {
    console.error('Error en guardar-fila:', error);
    return res.status(500).json({
      error: 'Error al guardar la fila',
      message: error.message,
    });
  }
};
