# Web App Médica - Comunidad Feeling

Aplicación web independiente para control y evaluación médica de pacientes. Conectada a Google Sheets con caché offline completo.

## 🏗️ Arquitectura

- **Frontend:** Vanilla JS + IndexedDB (offline-first)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Base de Datos:** Google Sheets API v4
- **Deploy:** Vercel

## 📁 Estructura del Proyecto

```
medical-web-app/
├── api/                          # Backend (Vercel Functions)
│   ├── obtener-registros.js      # GET /api/obtener-registros?medico=nombre
│   ├── guardar-fila.js           # POST /api/guardar-fila
│   ├── cerebroMedico.js          # Lógica de evaluación médica
│   └── utils/
│       └── googleSheets.js       # Conexión Sheets API
├── public/                       # Frontend estático
│   ├── index.html                # UI mobile-first
│   ├── styles.css                # Estilos salud holística
│   └── app.js                    # Lógica + IndexedDB caché
├── package.json                  # Dependencias
├── vercel.json                   # Configuración Vercel
├── .env.local                    # Variables locales (NO subir a git)
└── .env.example                  # Template de variables
```

## 🚀 Instalación y Desarrollo Local

### 1. Instalar dependencias

```bash
cd medical-web-app
npm install
```

### 2. Configurar variables de entorno

El archivo `.env.local` ya está configurado con tus credenciales. **Nunca subas este archivo a Git.**

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

Esto instalará Vercel CLI y abrirá la app en `http://localhost:3000`

### 4. Probar la app

1. Ingresa el nombre de un médico (ej: `Mercedes`, `Cristina`)
2. La app cargará los pacientes asignados a ese médico
3. Edita los campos y navega con "Anterior"/"Siguiente"
4. El guardado es automático al navegar

## 🌐 Deploy a Producción (Vercel)

### Opción A: Deploy desde CLI (Recomendado)

```bash
# Login a Vercel (si no lo estás)
npx vercel login

# Deploy a producción
npm run deploy
```

### Opción B: Deploy desde Git

1. **Crear repositorio en GitHub/GitLab:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/medical-app.git
   git push -u origin main
   ```

2. **Conectar Vercel al repositorio:**
   - Ve a https://vercel.com/new
   - Importa tu repositorio
   - Configura las variables de entorno:
     - `GOOGLE_CREDENTIALS` (contenido completo del JSON)
     - `SHEET_ID` = `1kXhb0zpOzeAxNuYe1PA1HjNPinweRZx9cXD1NozXqHU`
     - `SHEET_NAME` = `Respuestas de formulario 1`
   - Click en **Deploy**

### Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agregar:
   - `GOOGLE_CREDENTIALS`: Pega el contenido **completo** de tu archivo `credentials.json` (como un solo string, sin saltos de línea)
   - `SHEET_ID`: `1kXhb0zpOzeAxNuYe1PA1HjNPinweRZx9cXD1NozXqHU`
   - `SHEET_NAME`: `Respuestas de formulario 1`

**Importante:** Para `GOOGLE_CREDENTIALS`, el JSON debe estar en una sola línea:
```bash
# En Linux/Mac, puedes usar:
cat credentials.json | tr -d '\n'

# O en PowerShell:
(Get-Content credentials.json -Raw) -replace "`n", ""
```

## 🔑 Características

### ✅ Cerebro Médico
- **Limpieza automática:** Edad y DNI (solo números)
- **Cálculo de etapa:** 7 niveles (Niños, Prepúber, Adolescentes, Jóvenes, Adultos, Adultos mayores, Vejez)
- **IMC automático:** Umbral "Peso normal" hasta 25.3
- **Evaluación de riesgo:** 8 categorías + campos abiertos + flags

### ✅ Offline-First con IndexedDB
- **Caché completo:** Todos los pacientes se guardan localmente
- **Edición offline:** Los cambios se guardan en caché inmediatamente
- **Sync automático:** Al recuperar conexión, sincroniza pendientes
- **Reintentos:** 3 intentos de guardado + backoff exponencial

### ✅ UX Mobile-First
- **Colores:** Verde azulado (#2D9B8A) - salud holística
- **Touch targets:** 44px mínimo
- **Auto-save:** Al navegar entre pacientes
- **Búsqueda en tiempo real:** Filtrado instantáneo por nombre
- **Toast notifications:** Feedback visual de acciones

## 🔧 Endpoints de la API

### GET /api/obtener-registros?medico=nombre

Obtiene todos los registros asignados a un médico (case-insensitive).

**Response:**
```json
{
  "registros": [
    {
      "numFila": 2,
      "datos": ["timestamp", "nombre", "edad", ...]
    }
  ],
  "total": 15,
  "medico": "mercedes"
}
```

### POST /api/guardar-fila

Guarda una fila después de procesarla con el cerebro médico.

**Body:**
```json
{
  "numFila": 2,
  "datos": ["timestamp", "nombre", "edad", ...]
}
```

**Response:**
```json
{
  "exito": true,
  "numFila": 2,
  "resultados": {
    "edadLimpia": "72",
    "dniLimpio": "10455279",
    "etapa": "Adultos mayores",
    "imcNum": "28,91",
    "imcTexto": "Sobrepeso",
    "riesgo": "SÍ",
    "motivo": "Cardiovascular, Edad (>=70)"
  },
  "mensaje": "Fila 2 guardada exitosamente"
}
```

## 📊 Mapeo de Columnas (Índices 0-62)

| Índice | Columna | Campo | Editable |
|--------|---------|-------|----------|
| 1 | B | Nombre Completo | ❌ |
| 2 | C | Edad | ✅ |
| 3 | D | Etapa | 🔄 Auto |
| 4 | E | DNI | ✅ |
| 11 | L | Peso | ✅ |
| 12 | M | Altura | ✅ |
| 13 | N | IMC Número | 🔄 Auto |
| 14 | O | IMC Resultado | 🔄 Auto |
| 30 | AE | Respiratorias | ✅ |
| 31 | AF | Cardiovasculares | ✅ |
| 32 | AG | Anticoagulantes | ✅ |
| 33 | AH | Osteo-Articulares | ✅ |
| 34 | AI | Movilidad | ✅ |
| 35 | AJ | Metabólicas | ✅ |
| 36 | AK | Digestivas | ✅ |
| 39 | AN | Oncológicas | ✅ |
| 40 | AO | Neurológicas | ✅ |
| 43 | AR | Oculares | ✅ |
| 45 | AT | Secuelas ACV | ✅ |
| 46 | AU | Epilepsia | ✅ |
| 47 | AV | Psicológicas | ✅ |
| 48 | AW | Anorexia | ✅ |
| 49 | AX | Bulimia | ✅ |
| 50 | AY | Sustancias | ✅ |
| 52 | BA | Autoevaluación | ✅ |
| 60 | BI | Evaluación Riesgo | 🔄 Auto |
| 61 | BJ | Motivo de Riesgo | 🔄 Auto |
| 62 | BK | Controlador | ❌ |

✅ = Editable | 🔄 = Calculado automáticamente | ❌ = Readonly

## 🔒 Seguridad

- **Credenciales:** Nunca subir `.env.local` o `credentials.json` a Git
- **Service Account:** Solo tiene acceso al Sheet compartido
- **CORS:** Configurado para permitir cualquier origen (ajustar en producción si es necesario)
- **Validación:** Todos los inputs se validan en frontend y backend

## 🐛 Solución de Problemas

### Error: "Configuración de Google Sheets inválida"

1. Verifica que `GOOGLE_CREDENTIALS` esté bien formado (JSON en una línea)
2. Asegúrate de que el Sheet esté compartido con el email del Service Account
3. Verifica que la Sheets API esté habilitada en Google Cloud Console

### Error: "No se encontró la hoja"

1. Verifica que `SHEET_NAME` sea exactamente igual al nombre de la pestaña
2. Los nombres son case-sensitive: "Respuestas de formulario 1" ≠ "respuestas de formulario 1"

### La app no guarda cambios

1. Revisa la consola del navegador (F12) para errores
2. Verifica la conectividad (la app trabaja offline pero eventualmente necesita sync)
3. Revisa los logs de Vercel Functions en el dashboard

## 📱 Uso en Dispositivos Móviles

La app es completamente responsive y se puede:

1. **Agregar a la pantalla de inicio:**
   - iOS Safari: Botón compartir → "Agregar al inicio"
   - Android Chrome: Menú → "Agregar a pantalla principal"

2. **Funciona offline:** Una vez cargada, puede editar sin conexión

3. **Notificaciones:** Toasts visibles incluso en pantallas pequeñas

## 📈 Próximas Caracterías (Placeholder)

- **Estadísticas:** Dashboard con métricas de pacientes por etapa, riesgo, etc.
- **Exportar datos:** Download de reportes en CSV/PDF
- **Historial de cambios:** Track de ediciones por paciente

## 👨‍💻 Desarrollo

### Agregar nuevas funciones al cerebro médico

Editar `api/cerebroMedico.js`. La lógica es idempotente y se ejecuta tanto en el formulario original como en esta app.

### Modificar campos editables

1. Agregar el campo en `public/index.html`
2. Mapear el índice en `public/app.js` (objeto `COLUMNAS`)
3. Actualizar `obtenerDatosDelFormulario()` y `cargarPacienteEnFormulario()`

## 📄 Licencia

Uso interno - Comunidad Feeling

## 🆘 Soporte

Para issues técnicos, revisar:
- Logs de Vercel: https://vercel.com/dashboard
- Google Cloud Console: https://console.cloud.google.com/apis/api/sheets.googleapis.com
