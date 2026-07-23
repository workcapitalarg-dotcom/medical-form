/**
 * APP.JS - MEDICAL WEB APP - PREMIUM CLINICAL DESIGN
 * v3.0 - Full 63 Data Fields, Fixed IndexedDB, Fixed Search
 */

// ==========================================
// CONFIGURACIÓN Y ESTADO
// ==========================================

const CONFIG = {
  DB_NAME: 'MedicalAppDB',
  DB_VERSION: 4,          // Incremented to force fresh stores
  STORE_NAME: 'pacientes',
  SYNC_STORE: 'syncQueue',
  API_GET: '/api/obtener-registros',
  API_SAVE: '/api/guardar-fila',
  API_TRAYECTO_GET: '/api/obtener-trayecto',
  API_TRAYECTO_SAVE: '/api/actualizar-controlador',
};

// Mapeo de las columnas relevantes del Google Sheet (0-62)
const COL = {
  TIMESTAMP: 0,
  NOMBRE: 1,
  EDAD: 2,
  ETAPA: 3,
  DNI: 4,
  PESO: 11,
  ALTURA: 12,
  IMC_NUM: 13,
  IMC_TXT: 14,
  RIESGO: 60,
  MOTIVO: 61,
  CONTROLADOR: 62
};

// Estado global
let state = {
  medico: '',
  todosPacientes: [],     // Listado completo (nunca se sobreescribe por búsqueda)
  pacientes: [],          // Vista activa (puede ser filtrada)
  indiceActual: 0,
  isDirty: false,
  isOnline: navigator.onLine,
  isSyncing: false,
  vistaActiva: 'fichas', // 'fichas' o 'trayecto'
  trayectoRegistros: [],
  trayectoFiltrados: []
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  initAccordions();

  // Online/Offline events
  window.addEventListener('online', () => {
    state.isOnline = true;
    showToast('Conexión recuperada 🌐', 'success');
    procesarColaSync();
  });
  window.addEventListener('offline', () => {
    state.isOnline = false;
    showToast('Modo offline 📶', 'warning');
  });

  // Revisar sesión previa
  const savedMedico = localStorage.getItem('medical_medico');
  if (savedMedico) {
    state.medico = savedMedico;
    // Switch screens immediately, then load
    switchToScreen('dashboard');
    const badge = document.getElementById('revisor-nombre-badge');
    if (badge) badge.textContent = `Dr/a. ${state.medico}`;
    await iniciarDashboard();
  }
});

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-anterior-top').addEventListener('click', () => navegar(-1));
  document.getElementById('btn-siguiente-top').addEventListener('click', () => navegar(1));

  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear-btn');

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.trim();
    searchClear.classList.toggle('visible', term.length > 0);
    filtrarPacientes(term);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    filtrarPacientes('');
    searchInput.focus();
  });

  document.getElementById('patient-form').addEventListener('input', () => {
    state.isDirty = true;
  });

  // Eventos Subvista Trayecto (Mercedes)
  const btnFichas = document.getElementById('btn-view-fichas');
  const btnTrayecto = document.getElementById('btn-view-trayecto');
  if (btnFichas) btnFichas.addEventListener('click', () => cambiarSubvista('fichas'));
  if (btnTrayecto) btnTrayecto.addEventListener('click', () => cambiarSubvista('trayecto'));

  const trayectoSearch = document.getElementById('trayecto-search-input');
  const trayectoClear = document.getElementById('trayecto-search-clear');
  if (trayectoSearch) {
    trayectoSearch.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (trayectoClear) trayectoClear.classList.toggle('visible', q.length > 0);
      filtrarTrayecto(q);
    });
  }
  if (trayectoClear) {
    trayectoClear.addEventListener('click', () => {
      trayectoSearch.value = '';
      trayectoClear.classList.remove('visible');
      filtrarTrayecto('');
      trayectoSearch.focus();
    });
  }

  // Auto-guardado de Columna BK al cambiar el input
  const tableBody = document.getElementById('trayecto-table-body');
  if (tableBody) {
    tableBody.addEventListener('change', (e) => {
      if (e.target && e.target.classList.contains('input-trayecto-bk')) {
        const numFila = parseInt(e.target.getAttribute('data-fila'), 10);
        const val = e.target.value;
        guardarColumnaBK(numFila, val, e.target);
      }
    });
  }
}

// ==========================================
// ACCORDIONS
// ==========================================

function initAccordions() {
  document.querySelectorAll('.section-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const section = button.parentElement;
      const isOpen = section.classList.contains('open');
      section.classList.toggle('open', !isOpen);
    });
  });
}

function contraerAcordeones() {
  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('open');
  });
}

// ==========================================
// PANTALLAS
// ==========================================

function switchToScreen(screenName) {
  document.getElementById('login-screen').classList.toggle('active', screenName === 'login');
  document.getElementById('dashboard-screen').classList.toggle('active', screenName === 'dashboard');
}

// ==========================================
// FLUJO DE DATOS
// ==========================================

async function handleLogin(e) {
  e.preventDefault();
  const nombre = document.getElementById('medico-nombre').value.trim();
  if (!nombre) return;

  state.medico = nombre;
  localStorage.setItem('medical_medico', nombre);
  switchToScreen('dashboard');
  const badge = document.getElementById('revisor-nombre-badge');
  if (badge) badge.textContent = `Dr/a. ${nombre}`;
  await iniciarDashboard();
}

async function handleLogout() {
  if (state.isDirty) await guardarCambiosActuales();
  localStorage.removeItem('medical_medico');
  location.reload();
}

async function iniciarDashboard() {
  verificarPermisosMercedes();
  showLoading('Cargando pacientes...', `Buscando registros de ${state.medico}`);

  try {
    // Siempre intenta cargar desde la API primero (Google Sheet)
    const url = `${CONFIG.API_GET}?medico=${encodeURIComponent(state.medico.toLowerCase())}`;
    console.log('[App] Fetching:', url);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    console.log('[App] API response:', data.total, 'registros');

    if (data.registros && data.registros.length > 0) {
      state.todosPacientes = data.registros;
      state.pacientes = [...state.todosPacientes];
      // Persistir offline
      guardarEnLocalSilently(data.registros);
    } else {
      console.warn('[App] API sin registros — datos:', data);
      showToast(`Sin pacientes asignados a "${state.medico}"`, 'warning');
      state.todosPacientes = [];
      state.pacientes = [];
    }
  } catch (err) {
    console.error('[App] Error API, fallback a IndexedDB:', err);
    showToast('Sin conexión — usando datos locales 💾', 'warning');
    const local = await obtenerPacientesLocal();
    state.todosPacientes = local;
    state.pacientes = [...local];
  }

  hideLoading();
  actualizarUX();

  if (state.pacientes.length > 0) {
    cargarPaciente(0);
    procesarColaSync();
  }
}

function actualizarUX() {
  const total = state.pacientes.length;
  document.getElementById('patient-total').textContent = total;
}

function cargarPaciente(index) {
  const paciente = state.pacientes[index];
  if (!paciente) return;

  state.indiceActual = index;
  state.isDirty = false;

  document.getElementById('patient-count').textContent = index + 1;

  const d = paciente.datos;

  // ─── Header Card Premium ───
  document.getElementById('paciente-nombre-label').textContent =
    (d[COL.NOMBRE] || 'Sin Nombre').toUpperCase();

  document.getElementById('paciente-edad-header').textContent =
    d[COL.EDAD] ? `${d[COL.EDAD]} años` : '—';

  document.getElementById('paciente-dni-header').textContent = d[COL.DNI] || '—';
  document.getElementById('paciente-etapa-header').textContent = d[COL.ETAPA] || '—';

  // Risk indicator bar
  const tieneRiesgo = (d[COL.RIESGO] || '').toString().toUpperCase().includes('SÍ') ||
                      (d[COL.RIESGO] || '').toString().toUpperCase().includes('SI');

  const riskBar = document.getElementById('risk-badge-header');
  if (riskBar) {
    riskBar.className = 'risk-bar-indicator ' + (tieneRiesgo ? 'risk-yes' : 'risk-no');
    const statusText = tieneRiesgo ? 'RIESGO DETECTADO' : 'SIN RIESGO';
    const motivoText = d[COL.MOTIVO] || 'Sin observaciones';
    riskBar.textContent = `${statusText}: ${motivoText}`;
  }

  // ─── Rellenar todos los campos (índice 1-62) ───
  for (let i = 1; i <= 62; i++) {
    const el = document.getElementById(`campo-${i}`);
    if (el) {
      el.value = (d[i] !== undefined && d[i] !== null) ? d[i] : '';
    }
  }

  actualizarBotonesNav();
  contraerAcordeones();
  
  // Scroll top de la tarjeta
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function actualizarBotonesNav() {
  const idx = state.indiceActual;
  const total = state.pacientes.length;
  const ant = idx === 0;
  const sig = idx >= total - 1;
  
  const antTop = document.getElementById('btn-anterior-top');
  const sigTop = document.getElementById('btn-siguiente-top');
  if (antTop) antTop.disabled = ant;
  if (sigTop) sigTop.disabled = sig;
}

async function navegar(delta) {
  if (state.isDirty) await guardarCambiosActuales();
  const nuevo = state.indiceActual + delta;
  if (nuevo >= 0 && nuevo < state.pacientes.length) {
    cargarPaciente(nuevo);
  }
}

async function guardarCambiosActuales() {
  const idx = state.indiceActual;
  const paciente = state.pacientes[idx];
  if (!paciente) return;

  const nuevosDatos = [...paciente.datos];
  // Extend to 63 if needed
  while (nuevosDatos.length < 63) nuevosDatos.push('');

  for (let i = 1; i <= 62; i++) {
    const el = document.getElementById(`campo-${i}`);
    if (el && !el.readOnly) {
      nuevosDatos[i] = el.value;
    }
  }

  // Update local state
  state.pacientes[idx].datos = nuevosDatos;
  // Also update in the master list
  const masterIdx = state.todosPacientes.findIndex(p => p.numFila === paciente.numFila);
  if (masterIdx !== -1) state.todosPacientes[masterIdx].datos = nuevosDatos;

  state.isDirty = false;
  
  // LOG PARA DEPURAR (Frontend)
  console.log(`[Frontend] Iniciando guardado de ${paciente.datos[COL.NOMBRE]}...`);

  try {
    await encolarParaSync(paciente.numFila, nuevosDatos);
    await guardarEnLocalSilently(state.todosPacientes);
    procesarColaSync();
  } catch (err) {
    console.error('[Save] Error guardando:', err);
    showToast('Error al guardar ❌', 'error');
  }
}

// BÚSQUEDA — NO sobreescribe todosPacientes
async function filtrarPacientes(termino) {
  if (state.isDirty) await guardarCambiosActuales();
  
  if (!termino) {
    state.pacientes = [...state.todosPacientes];
  } else {
    const q = termino.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    state.pacientes = state.todosPacientes.filter(p => {
      const nombre = (p.datos[COL.NOMBRE] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return nombre.includes(q);
    });
  }

  state.indiceActual = 0;
  actualizarUX();

  if (state.pacientes.length > 0) {
    cargarPaciente(0);
  } else {
    showToast('Sin coincidencias para esa búsqueda', 'info');
  }
}

// ==========================================
// INDEXEDDB — Usando Promesas Correctas
// ==========================================

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Eliminar stores obsoletos para forzar recreación limpia
      if (db.objectStoreNames.contains(CONFIG.STORE_NAME)) {
        db.deleteObjectStore(CONFIG.STORE_NAME);
      }
      if (db.objectStoreNames.contains(CONFIG.SYNC_STORE)) {
        db.deleteObjectStore(CONFIG.SYNC_STORE);
      }
      db.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'id' });
      db.createObjectStore(CONFIG.SYNC_STORE, { keyPath: 'numFila' });
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

// Guarda silenciosamente sin interrumpir el flujo
async function guardarEnLocalSilently(pacientes) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
      tx.objectStore(CONFIG.STORE_NAME).put({
        id: 'current_list',
        data: pacientes,
        lastUpdated: Date.now()
      });
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] No se pudo guardar localmente:', err);
  }
}

async function obtenerPacientesLocal() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CONFIG.STORE_NAME, 'readonly');
      const req = tx.objectStore(CONFIG.STORE_NAME).get('current_list');
      req.onsuccess = () => resolve(req.result ? req.result.data : []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error leyendo datos locales:', err);
    return [];
  }
}

async function encolarParaSync(numFila, datos) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(CONFIG.SYNC_STORE, 'readwrite');
      tx.objectStore(CONFIG.SYNC_STORE).put({ numFila, datos, timestamp: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error encolando sync:', err);
  }
}

async function procesarColaSync() {
  if (state.isSyncing || !state.isOnline) return;
  state.isSyncing = true;

  try {
    let hasItems = true;
    while (hasItems) {
      const db = await openDB();
      const items = await new Promise((resolve) => {
        const tx = db.transaction(CONFIG.SYNC_STORE, 'readonly');
        const req = tx.objectStore(CONFIG.SYNC_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      if (items.length === 0) {
        hasItems = false;
        break;
      }

      showSaveIndicator(true);

      for (const item of items) {
        try {
          const res = await fetch(CONFIG.API_SAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numFila: item.numFila, datos: item.datos })
          });
          const result = await res.json();

            if (result.exito && result.datosActualizados) {
              // 1. Actualizar en la lista maestra (imprescindible para que persista al navegar)
              const masterIdx = state.todosPacientes.findIndex(p => p.numFila === item.numFila);
              if (masterIdx !== -1) {
                state.todosPacientes[masterIdx].datos = result.datosActualizados;
              }

              // 2. Actualizar en la vista filtrada actual (por si hay una búsqueda activa)
              const viewingIdx = state.pacientes.findIndex(p => p.numFila === item.numFila);
              if (viewingIdx !== -1) {
                state.pacientes[viewingIdx].datos = result.datosActualizados;
                
                // 3. SOLO SI el usuario está viendo este paciente AHORA, refrescar la UI
                if (state.indiceActual === viewingIdx) {
                  cargarPaciente(state.indiceActual);
                }
              }

              // 4. Persistir el cambio calculado en IndexedDB para modo offline
              await guardarEnLocalSilently(state.todosPacientes);
            }

            // Eliminar de la cola tras éxito
            await new Promise((resolve) => {
              const tx = db.transaction(CONFIG.SYNC_STORE, 'readwrite');
              tx.objectStore(CONFIG.SYNC_STORE).delete(item.numFila);
              tx.oncomplete = resolve;
            });
        } catch (err) {
          console.error('[Sync] Error en item:', item.numFila, err);
          hasItems = false; // Detener bucle si hay error de red
          break;
        }
      }
    }
  } catch (err) {
    console.error('[Sync] Error crítico en cola:', err);
  } finally {
    state.isSyncing = false;
    showSaveIndicator(false);
  }
}

// ==========================================
// UI HELPERS
// ==========================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function showLoading(title, subtitle) {
  const overlay = document.getElementById('loading-overlay');
  document.getElementById('loading-title').textContent = title;
  document.getElementById('loading-subtitle').textContent = subtitle;
  overlay.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

function showSaveIndicator(show) {
  const el = document.getElementById('save-indicator');
  if (el) el.classList.toggle('hidden', !show);
}

// ==========================================
// MÓDULO SHEET TRAYECTO (Mercedes)
// ==========================================

function verificarPermisosMercedes() {
  const pills = document.getElementById('trayecto-nav-pills');
  const esMercedes = (state.medico || '').toLowerCase().trim().includes('mercedes');
  if (pills) {
    pills.classList.toggle('hidden', !esMercedes);
  }
}

function cambiarSubvista(vista) {
  state.vistaActiva = vista;
  const viewFichas = document.getElementById('view-fichas');
  const viewTrayecto = document.getElementById('view-trayecto');
  const btnFichas = document.getElementById('btn-view-fichas');
  const btnTrayecto = document.getElementById('btn-view-trayecto');

  if (vista === 'fichas') {
    if (viewFichas) viewFichas.classList.remove('hidden');
    if (viewTrayecto) viewTrayecto.classList.add('hidden');
    if (btnFichas) btnFichas.classList.add('active');
    if (btnTrayecto) btnTrayecto.classList.remove('active');
  } else if (vista === 'trayecto') {
    if (viewFichas) viewFichas.classList.add('hidden');
    if (viewTrayecto) viewTrayecto.classList.remove('hidden');
    if (btnFichas) btnFichas.classList.remove('active');
    if (btnTrayecto) btnTrayecto.classList.add('active');

    if (state.trayectoRegistros.length === 0) {
      cargarVistaTrayecto();
    }
  }
}

async function cargarVistaTrayecto() {
  const tbody = document.getElementById('trayecto-table-body');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Cargando registros de trayecto... ⏳</td></tr>';
  }

  try {
    const res = await fetch(CONFIG.API_TRAYECTO_GET);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.trayectoRegistros = data.registros || [];
    state.trayectoFiltrados = [...state.trayectoRegistros];
    renderizarTablaTrayecto();
  } catch (err) {
    console.error('[Trayecto] Error al cargar:', err);
    showToast('Error al cargar la tabla de trayecto ❌', 'error');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-error py-4">Error al cargar datos del servidor</td></tr>';
    }
  }
}

function renderizarTablaTrayecto() {
  const tbody = document.getElementById('trayecto-table-body');
  if (!tbody) return;

  if (state.trayectoFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron registros</td></tr>';
    return;
  }

  tbody.innerHTML = state.trayectoFiltrados.map(item => `
    <tr>
      <td><strong>#${item.numFila}</strong></td>
      <td>${item.nombre ? escapeHtml(item.nombre) : '<em style="color:#94A3B8;">Sin nombre</em>'}</td>
      <td>
        <input 
          type="text" 
          class="input-trayecto-bk" 
          data-fila="${item.numFila}" 
          data-prev="${escapeHtml(item.controlador || '')}"
          value="${escapeHtml(item.controlador || '')}" 
          placeholder="Escribe el controlador (ej: Mercedes)..."
        >
      </td>
      <td style="text-align: center;" id="status-badge-${item.numFila}">
        <span class="trayecto-status-badge status-idle">Sin cambios</span>
      </td>
    </tr>
  `).join('');
}

function filtrarTrayecto(termino) {
  if (!termino) {
    state.trayectoFiltrados = [...state.trayectoRegistros];
  } else {
    const q = termino.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    state.trayectoFiltrados = state.trayectoRegistros.filter(item => {
      const nombre = (item.nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const controlador = (item.controlador || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return nombre.includes(q) || controlador.includes(q);
    });
  }
  renderizarTablaTrayecto();
}

async function guardarColumnaBK(numFila, valor, inputEl) {
  const prevVal = inputEl ? inputEl.getAttribute('data-prev') : '';
  const valorTrim = valor ? valor.trim() : '';

  if (prevVal === valorTrim) return; // Sin cambios

  const badgeCell = document.getElementById(`status-badge-${numFila}`);
  if (badgeCell) {
    badgeCell.innerHTML = '<span class="trayecto-status-badge status-saving">Guardando... ⏳</span>';
  }

  try {
    const res = await fetch(CONFIG.API_TRAYECTO_SAVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numFila, controlador: valorTrim })
    });

    const data = await res.json();
    if (!res.ok || !data.exito) throw new Error(data.error || 'Error al guardar');

    if (inputEl) {
      inputEl.setAttribute('data-prev', valorTrim);
      inputEl.classList.add('saved-flash');
      setTimeout(() => inputEl.classList.remove('saved-flash'), 1000);
    }

    const item = state.trayectoRegistros.find(r => r.numFila === numFila);
    if (item) item.controlador = valorTrim;

    if (badgeCell) {
      badgeCell.innerHTML = '<span class="trayecto-status-badge status-saved">Guardado ✓</span>';
      setTimeout(() => {
        if (badgeCell.innerHTML.includes('Guardado ✓')) {
          badgeCell.innerHTML = '<span class="trayecto-status-badge status-idle">Sin cambios</span>';
        }
      }, 3000);
    }

    showToast(`Fila #${numFila} actualizada a "${valorTrim || '(Vacío)'}" ✅`, 'success');
  } catch (err) {
    console.error('[Trayecto] Error al guardar controlador:', err);
    if (badgeCell) {
      badgeCell.innerHTML = '<span class="trayecto-status-badge status-error" style="background:#FEE2E2;color:#991B1B;">Error ❌</span>';
    }
    showToast(`Error al guardar fila #${numFila} ❌`, 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
