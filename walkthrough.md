# Walkthrough - Web App Médica (Comunidad Feeling)

## 📌 Historial de Cambios y Estado del Proyecto

### 1. Diagnóstico de Alineación de Columnas (16-Jul-2026)
* **Problema:** El usuario reportó que no se visualizaban los registros de ningún médico (ej: 'Mercedes').
* **Investigación:** Detectamos una columna accidental en el índice 60 (`fdafsf f`) que desplazaba las demás columnas.
* **Resolución:** El usuario eliminó la columna errónea de la hoja directamente, restableciendo la estructura de 63 columnas. La búsqueda volvió a funcionar de inmediato.

### 2. Configuración e Inicialización de Git (16-Jul-2026)
* **Acción:** Preparamos el proyecto para sincronización limpia con Vercel.
* **Cambios en Git:**
  - Inicializamos el repositorio local (`git init`).
  - Agregamos la regla de exclusión `*.bak` a [.gitignore](file:///c:/temp/Antigravity/medical-web-app/.gitignore) para omitir archivos de respaldo temporal (`app.js.bak`, etc.), asegurando que solo se sincronice el código fuente esencial.
  - Establecimos la rama principal como `main`.
  - Realizamos el commit inicial (`Initial commit: prepared files for Vercel deployment`).
  - **Sincronización:** Cambiamos el protocolo del repositorio remoto a HTTPS (`https://github.com/workcapitalarg-dotcom/medical-form.git`) debido a falta de claves SSH configuradas localmente. Esto permitió a Git utilizar de manera transparente el Administrador de Credenciales de Windows del usuario (asociado a `vidyaganeshcatamarca@gmail.com`).
  - **Push Exitoso:** Se empujó la rama principal al repositorio remoto (`git push -u origin main`).

### 3. Autenticación Robusta en Vercel (16-Jul-2026)
* **Problema:** Vercel no cargaba los datos debido a problemas al parsear la variable de entorno `GOOGLE_CREDENTIALS` (los saltos de línea de la llave privada se corrompen al copiarse en la UI de Vercel).
* **Solución:**
  - Modificamos [googleSheets.js](file:///c:/temp/Antigravity/medical-web-app/api/utils/googleSheets.js) para soportar variables de entorno individuales (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` y opcionalmente `GOOGLE_PROJECT_ID`).
  - Agregamos un reemplazo automático en caliente (`replace(/\\n/g, '\n')`) para corregir los saltos de línea escapados en la clave privada.
  - Verificamos el funcionamiento correcto localmente mediante simulación y empujamos los cambios a la rama remota `main`.

### 4. Corrección de Ruteo Serverless 404 (16-Jul-2026)
* **Problema:** Las peticiones a la API retornaban un código HTTP 404 en producción, debido a configuraciones de compilación heredadas (`"builds"` y `"routes"`) en `vercel.json`.
* **Solución:**
  - Modificamos [vercel.json](file:///c:/temp/Antigravity/medical-web-app/vercel.json) reemplazando `"builds"` por la configuración moderna `"rewrites"` basada en Zero-Config. Esto permite a Vercel compilar automáticamente la carpeta `/api/` como funciones serverless nativas de Node.js y enrutar las peticiones estáticas a `/public/` sin fallos.

### 5. Actualización del Entorno Node.js a 24.x y Corrección de Build Recursivo (16-Jul-2026)
* **Problema:** La compilación en Vercel falló inicialmente por obsolescencia de Node.js v20, y luego falló porque el comando de compilación `"build": "vercel build"` en `package.json` causaba una invocación recursiva infinita dentro del contenedor de compilación de Vercel.
* **Solución:**
  - Editamos [package.json](file:///c:/temp/Antigravity/medical-web-app/package.json) actualizando el motor a `"24.x"`.
  - Cambiamos el script de compilación a `"build": "echo 'No build step required'"`, ya que las aplicaciones web sin framework y con serverless functions de Vercel no requieren un paso de compilación personalizado (Vercel procesa las carpetas `/public` y `/api` automáticamente).
  - Confirmamos y empujamos el cambio a GitHub.
* **Estado:** Listo. El despliegue de Vercel se reconstruirá automáticamente sin llamadas recursivas y con Node.js v24.

### 6. Módulo "Sheet Trayecto" para Usuario Mercedes (23-Jul-2026)
* **Requerimiento:** Crear una nueva vista/menú en el dashboard para el usuario 'Mercedes' que permita ver la Columna B (Nombre, solo lectura) y editar la Columna BK (Controlador/Revisor), realizando el guardado automático celda por celda sin presionar un botón manual.
* **TDD & Backend API:**
  - Creados los tests unitarios en [test/actualizar-controlador.test.js](file:///c:/temp/Antigravity/medical-web-app/test/actualizar-controlador.test.js) con `node:test`.
  - Endpoint `GET` [api/obtener-trayecto.js](file:///c:/temp/Antigravity/medical-web-app/api/obtener-trayecto.js): Retorna el listado completo de filas asignando `numFila`, `nombre` (Col. B) y `controlador` (Col. BK).
  - Endpoint `POST` [api/actualizar-controlador.js](file:///c:/temp/Antigravity/medical-web-app/api/actualizar-controlador.js): Actualiza directamente la celda `BK{numFila}` en Google Sheets usando `updateRangeValues`.
  - Integradas las rutas en [server.js](file:///c:/temp/Antigravity/medical-web-app/server.js).
* **Frontend (UI/UX):**
  - En [public/index.html](file:///c:/temp/Antigravity/medical-web-app/public/index.html): Añadido el contenedor de pestañas navegables (`Fichas` / `Sheet Trayecto`) en el header y la vista en formato tabla para la edición de Trayecto.
  - En [public/styles.css](file:///c:/temp/Antigravity/medical-web-app/public/styles.css): Agregados estilos responsivos para las pestañas header, la tabla de Trayecto y las insignias de estado de auto-guardado en tiempo real (`Guardado ✓`, `Guardando... ⏳`).
  - En [public/app.js](file:///c:/temp/Antigravity/medical-web-app/public/app.js): Implementada la detección de rol de Mercedes, conmutación de pestañas, búsqueda/filtro de pacientes y el auto-guardado reactivo al modificar la Columna BK.

---
*Documento de seguimiento actualizado por el asistente de IA Antigravity.*
