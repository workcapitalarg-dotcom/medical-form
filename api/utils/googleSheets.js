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
    let credentials;

    if (process.env.GOOGLE_CREDENTIALS && process.env.GOOGLE_CREDENTIALS.trim() !== '') {
      // Opción 1: JSON completo
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      // Opción 2: Variables separadas
      // Sanitizar la clave privada reemplazando \n escapados por saltos de línea reales
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim();
      credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL.trim(),
        private_key: privateKey,
        project_id: process.env.GOOGLE_PROJECT_ID ? process.env.GOOGLE_PROJECT_ID.trim() : undefined,
      };
    } else {
      throw new Error('No se encontraron credenciales válidas en las variables de entorno (se requiere GOOGLE_CREDENTIALS o GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY)');
    }

    // Crear autenticación con Service Account
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    cachedAuth = auth;
    return auth;
  } catch (error) {
    console.error('Error al configurar autenticación de Google:', error.message);
    throw new Error('Configuración de Google Sheets inválida: ' + error.message);
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
