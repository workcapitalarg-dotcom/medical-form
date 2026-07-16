/**
 * Utilidad para conexión con Google Sheets API v4
 * Usa Service Account para autenticación
 */

const { google } = require('googleapis');

let cachedAuth = null;

/**
 * Obtener cliente autenticado de Google Sheets
 * @returns {Promise<Object>} Cliente de Sheets API
 */
async function getSheetsClient() {
  if (cachedAuth) {
    return cachedAuth;
  }

  try {
    // Parsear credenciales desde variable de entorno
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    // Crear autenticación con Service Account
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    cachedAuth = auth;
    return auth;
  } catch (error) {
    console.error('Error al configurar autenticación de Google:', error.message);
    throw new Error('Configuración de Google Sheets inválida. Verifica GOOGLE_CREDENTIALS');
  }
}

/**
 * Obtener valores de un rango del Sheet
 * @param {string} spreadsheetId - ID del Sheet
 * @param {string} range - Rango (ej: "A1:Z100")
 * @returns {Promise<Array>} Valores del rango
 */
async function getRangeValues(spreadsheetId, range) {
  try {
    const auth = await getSheetsClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error al leer del Sheet:', error.message);
    throw error;
  }
}

/**
 * Actualizar valores en un rango del Sheet
 * @param {string} spreadsheetId - ID del Sheet
 * @param {string} range - Rango (ej: "A2:BM2")
 * @param {Array<Array>} values - Valores a escribir (2D array)
 * @returns {Promise<Object>} Resultado de la actualización
 */
async function updateRangeValues(spreadsheetId, range, values) {
  try {
    const auth = await getSheetsClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error al escribir en el Sheet:', error.message);
    throw error;
  }
}

/**
 * Obtener todas las filas del Sheet
 * @param {string} spreadsheetId - ID del Sheet
 * @param {string} sheetName - Nombre de la hoja
 * @returns {Promise<Array>} Todas las filas (incluyendo header)
 */
async function getAllRows(spreadsheetId, sheetName) {
  const range = `${sheetName}!A1:BM`;
  return await getRangeValues(spreadsheetId, range);
}

module.exports = {
  getSheetsClient,
  getRangeValues,
  updateRangeValues,
  getAllRows,
};
