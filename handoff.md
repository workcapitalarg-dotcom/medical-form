# Medical Web App - Data Management & Clinical Evaluation
## Handoff & Technical Specifications

Este documento sirve como blueprint completo para la reconstrucción o continuación del desarrollo de la aplicación **Control Médico**.

---

## 1. Visión General
Una SPA (Single Page Application) diseñada para revisores médicos que procesan fichas de pacientes de forma masiva. Prioriza la velocidad de entrada de datos, la persistencia offline y la automatización de la evaluación de riesgo clínico.

## 2. Pila Tecnológica
- **Backend**: Node.js + Express.
- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables), Vanilla JavaScript.
- **Base de Datos**: Google Sheets (Cloud) + IndexedDB (Local/Offline).
- **Integración**: REST API personalizada para sincronización bidireccional.

---

## 3. Arquitectura del Sistema

### A. Capa de Datos (Sincronización Híbrida)
La aplicación utiliza un patrón **Offline-First** con una cola de sincronización:
1.  **Carga Inicial**: Al iniciar sesión, el sistema descarga todos los registros asignados al "Revisor" desde Google Sheets y los guarda en IndexedDB (`medical_db`).
2.  **Edición**: Al modificar cualquier campo, el estado local (`state.isDirty`) se marca como verdadero.
3.  **Persistencia**:
    - El guardado se dispara al navegar (Anterior/Siguiente), al buscar o al cerrar sesión.
    - Se encola la fila modificada en una tabla de `sync_queue` en IndexedDB.
    - Un proceso de sincronización (`procesarColaSync`) intenta enviar los datos al servidor Node.js.
4.  **Actualización Dinámica**: El servidor responde con la fila procesada (incluyendo cálculos médicos re-evaluados). El frontend actualiza su estado local y la UI inmediatamente sin recargar.

### B. Cerebro Médico (Lógica Clínica)
El motor de evaluación reside en `api/cerebroMedico.js` para asegurar consistencia:
-   **Cálculo de Edad/DNI**: Limpieza de caracteres no numéricos.
-   **Etapa de Vida**: Clasificación automática (Niño, Adolescente, Adulto, etc.) según edad.
-   **IMC**: Cálculo de Índice de Masa Corporal con limpieza de formatos de punto/coma.
-   **Evaluación de Riesgo**:
    -   **Búsqueda Semántica**: Escanea 63 campos buscando raíces de palabras clave (ej: "hiper", "diabet", "corazon").
    -   **Campos Críticos**: Detecta adicciones, secuelas, anticoagulantes y autoevaluaciones de riesgo.
    -   **Prioridad "No Aplica"**: Si un campo contiene "N/A" o "no aplica", esa regla específica se ignora para la evaluación de riesgo del paciente.

---

## 4. UI / UX Patterns

### A. Cabecera Inteligente (Sticky Multi-Row)
Diseñada para maximizar el área de trabajo en móviles:
-   **Fila 1 (Sistema)**: Título de la app, nombre del Revisor y botón de Logout (Power icon).
-   **Fila 2 (Navegación)**: Botones compactos de navegación (Anterior/Siguiente), nombre del paciente actual y contador de posición (X / Total). Esta fila es **sticky**, permitiendo navegar sin desplazarse al inicio del formulario.

### B. Formulario de 63 Campos
-   Organizado en **Acordeones Correspondiendtes a Rubros**: Los campos se dividen en secciones desplegables para evitar el agobio visual.
-   **Auto-contracción**: Al pasar de un paciente a otro, todos los acordeones se cierran automáticamente para presentar una vista limpia del nuevo registro.
-   **Indicador de Riesgo**: Una barra de color (Verde/Rojo) fija bajo la navegación que muestra el estado de riesgo y el motivo clínico en tiempo real.

### C. Feedback Visual
-   **Save Indicator**: Un spinner flotante arriba a la derecha que indica cuándo hay una sincronización en curso con Google Sheets.
-   **Toasts**: Notificaciones no intrusivas para confirmar guardado exitoso, errores de conexión o resultados de búsqueda.

---

## 5. Endpoints API Críticos
-   `GET /api/get-registros?medico=X`: Filtra registros en Google Sheets donde la columna BK (Control) coincida con el nombre del médico.
-   `POST /api/guardar-fila`: 
    -   Recibe: `{ numFila, datos }`.
    -   Ejecuta `cerebroMedico`.
    -   Actualiza Google Sheets.
    -   Retorna: `{ exito, datosActualizados }`.

---

## 6. Instrucciones para Continuación
1.  **Mantener Vanilla**: No introducir frameworks (React/Vue/Tailwind) para preservar la ligereza y compatibilidad directa.
2.  **Lógica del Cerebro**: Cualquier cambio en las reglas de evaluación debe hacerse en `api/cerebroMedico.js`. Las raíces de palabras clave están en el array `reglas`.
3.  **Sticky offsets**: Si se cambia la altura del header, ajustar el `scroll-margin-top` de los acordeones en CSS para que no queden ocultos tras la cabecera al abrirlos.
4.  **Sincronización**: El guardado en el cierre de sesión es crítico; no debe removerse nunca el `await guardarCambiosActuales()` en `handleLogout`.

---
*Generado por Antigravity AI - Blueprint de Proyecto Médico*
