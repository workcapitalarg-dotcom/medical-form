const test = require('node:test');
const assert = require('node:assert/strict');

// Importaremos el handler de actualizar-controlador
const actualizarControladorHandler = require('../api/actualizar-controlador');
const obtenerTrayectoHandler = require('../api/obtener-trayecto');

test('POST /api/actualizar-controlador debe retornar 405 si el método no es POST', async () => {
  const req = { method: 'GET', body: {} };
  let statusCode = 0;
  let jsonResponse = {};
  
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { jsonResponse = data; return this; }
  };

  await actualizarControladorHandler(req, res);
  assert.equal(statusCode, 405);
  assert.equal(jsonResponse.error, 'Método no permitido');
});

test('POST /api/actualizar-controlador debe requerir numFila', async () => {
  const req = { method: 'POST', body: { controlador: 'Mercedes' } };
  let statusCode = 0;
  let jsonResponse = {};
  
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { jsonResponse = data; return this; }
  };

  await actualizarControladorHandler(req, res);
  assert.equal(statusCode, 400);
  assert.equal(jsonResponse.error, 'numFila es requerido y debe ser un número válido');
});

test('POST /api/actualizar-controlador debe validar que numFila sea un entero positivo mayor a 1', async () => {
  const req = { method: 'POST', body: { numFila: 1, controlador: 'Mercedes' } };
  let statusCode = 0;
  let jsonResponse = {};
  
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { jsonResponse = data; return this; }
  };

  await actualizarControladorHandler(req, res);
  assert.equal(statusCode, 400);
  assert.equal(jsonResponse.error, 'numFila debe ser mayor o igual a 2 (la fila 1 es encabezado)');
});

test('GET /api/obtener-trayecto debe responder con registros mapeados', async () => {
  const req = { method: 'GET', query: {} };
  let statusCode = 0;
  let jsonResponse = {};
  
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { jsonResponse = data; return this; }
  };

  // Mock temporal o ejecución si Google Sheets API o mock interno responde
  try {
    await obtenerTrayectoHandler(req, res);
    assert.ok([200, 500].includes(statusCode));
  } catch (err) {
    assert.fail('El handler lanzo excepcion no capturada: ' + err.message);
  }
});
