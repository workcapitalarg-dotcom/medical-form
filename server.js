/**
 * SERVIDOR LOCAL - WEB APP MÉDICA
 * Express + Google Sheets API
 */
const express = require('express');
const path = require('path');
const app = express();

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Middleware para JSON y archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Importar controladores adaptados a Express
const obtenerRegistros = require('./api/obtener-registros');
const guardarFila = require('./api/guardar-fila');
const obtenerTrayecto = require('./api/obtener-trayecto');
const actualizarControlador = require('./api/actualizar-controlador');

// Rutas
app.get('/api/obtener-registros', obtenerRegistros);
app.post('/api/guardar-fila', guardarFila);
app.get('/api/obtener-trayecto', obtenerTrayecto);
app.post('/api/actualizar-controlador', actualizarControlador);

const PORT = 3000;
app.listen(PORT, (err) => {
  if (err) console.error('Error al iniciar el servidor:', err);
  else console.log(`Servidor local corriendo en http://localhost:${PORT}`);
});
