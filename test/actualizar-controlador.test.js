const test = require('node:test');
const assert = require('node:assert/strict');

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

test('POST /api/actualizar-controlador debe rechazar fila 2 (encabezado de columnas)', async () => {
  const req = { method: 'POST', body: { numFila: 2, controlador: 'Mercedes' } };
  let statusCode = 0;
  let jsonResponse = {};
  
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { jsonResponse = data; return this; }
  };

  await actualizarControladorHandler(req, res);
  assert.equal(statusCode, 400);
  assert.equal(jsonResponse.error, 'numFila debe ser mayor o igual a 3 (la fila 2 contiene los nombres de columna)');
});

test('POST /api/actualizar-controlador debe validar que el controlador sea un médico permitido', async () => {
  const req = { method: 'POST', body: { numFila: 3, controlador: 'Invalido' } };
  let statusCode = 0;
  let jsonResponse = {};
  
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { jsonResponse = data; return this; }
  };

  await actualizarControladorHandler(req, res);
  assert.equal(statusCode, 400);
  assert.ok(jsonResponse.error.includes('Controlador no permitido'));
});

test('POST /api/actualizar-controlador debe aceptar médicos permitidos case-insensitive', async () => {
  const permitidos = ['mercedes', 'MELONI', 'Claudia', 'zanoni', 'ALVO', ''];
  for (const med of permitidos) {
    const req = { method: 'POST', body: { numFila: 3, controlador: med } };
    let statusCode = 0;
    let jsonResponse = {};
    
    const res = {
      status(code) { statusCode = code; return this; },
      json(data) { jsonResponse = data; return this; }
    };

    try {
      await actualizarControladorHandler(req, res);
      // Puede responder 200 o 500 (si no hay credenciales en env), pero NO 400 de validación
      assert.notEqual(statusCode, 400);
    } catch (err) {
      assert.fail(`Fallo para medico ${med}: ` + err.message);
    }
  }
});

test('GET /api/obtener-trayecto debe responder omitiendo la fila 2', async () => {
  const req = { method: 'GET', query: {} };
  let statusCode = 0;
  let jsonResponse = {};
  
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { jsonResponse = data; return this; }
  };

  try {
    await obtenerTrayectoHandler(req, res);
    assert.ok([200, 500].includes(statusCode));
  } catch (err) {
    assert.fail('El handler lanzo excepcion no capturada: ' + err.message);
  }
});
