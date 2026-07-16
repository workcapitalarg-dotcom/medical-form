# 🚀 GUÍA RÁPIDA DE INICIO

## ✅ Archivos Creados

Tu proyecto está completo en: `C:\Users\Vidya Ganesh\medical-web-app\`

**Archivos principales:**
```
medical-web-app/
├── api/                          # Backend (4 archivos)
├── public/                       # Frontend (3 archivos)
├── package.json                  # Dependencias
├── vercel.json                   # Configuración
├── .env.local                    # TUS credenciales (NO subir)
├── .env.example                  # Template
├── .gitignore                    # Exclusiones Git
└── README.md                     # Documentación completa
```

---

## 📍 PRÓXIMOS PASOS

### **OPCIÓN 1: Probar Localmente (Recomendado primero)**

```powershell
# 1. Ir al directorio del proyecto
cd "C:\Users\Vidya Ganesh\medical-web-app"

# 2. Iniciar servidor de desarrollo
npx vercel dev
```

**Esto hará:**
- Instalará Vercel CLI si no existe
- Iniciará un servidor local en `http://localhost:3000`
- Las funciones API se ejecutarán localmente

**Para probar:**
1. Abre `http://localhost:3000` en tu navegador
2. Ingresa un nombre de médico (ej: `Mercedes`, `Cristina`)
3. La app cargará los pacientes asignados
4. Edita campos y navega con "Anterior"/"Siguiente"

---

### **OPCIÓN 2: Deploy a Producción (Vercel)**

#### **Paso A: Login a Vercel**

```powershell
npx vercel login
```

Te pedirá:
1. Elegir método de login (email, GitHub, GitLab)
2. Seguir las instrucciones en el navegador

#### **Paso B: Configurar Variables de Entorno**

**IMPORTANTE:** Vercel necesita las variables de entorno configuradas.

1. Ve a https://vercel.com/dashboard
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas 3 variables:

| Nombre | Valor |
|--------|-------|
| `GOOGLE_CREDENTIALS` | *(Ver abajo cómo obtenerlo)* |
| `SHEET_ID` | `1kXhb0zpOzeAxNuYe1PA1HjNPinweRZx9cXD1NozXqHU` |
| `SHEET_NAME` | `Respuestas de formulario 1` |

**¿Cómo obtener GOOGLE_CREDENTIALS en una línea?**

Ejecuta este comando en PowerShell:

```powershell
# Lee el archivo y lo convierte a una sola línea
$content = Get-Content "C:\Users\Vidya Ganesh\medical-web-app\.env.local" -Raw
# Extrae solo el valor de GOOGLE_CREDENTIALS
$match = [regex]::Match($content, 'GOOGLE_CREDENTIALS=(\{.*\})')
$credentials = $match.Groups[1].Value
Write-Output $credentials
```

Copia el resultado y pégalo en Vercel como el valor de `GOOGLE_CREDENTIALS`.

#### **Paso C: Deploy**

```powershell
# Deploy a producción
npx vercel --prod
```

**Esto hará:**
- Subirá tu código a Vercel
- Creará una URL única (ej: `medical-app-feeling.vercel.app`)
- Las funciones API se ejecutarán en la nube

---

## 🔍 VERIFICAR QUE FUNCIONA

### Test Local

1. **Abre la app:** `http://localhost:3000`
2. **Ingresa:** `Mercedes` (u otro médico del Sheet)
3. **Deberías ver:** Lista de pacientes asignados
4. **Edita un campo:** Ej: cambiar peso
5. **Presiona "Siguiente":** Auto-save debería disparar
6. **Verifica:** Toast verde "Guardado exitosamente"

### Test en Producción

1. **Abre la URL** que te dio Vercel
2. **Mismo proceso** que local
3. **Verifica el Sheet:** Los cambios deberían aparecer en Google Sheets

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Error al obtener registros"

**Causas posibles:**
1. Las credenciales no están bien configuradas
2. El Sheet no está compartido con el Service Account

**Solución:**
```powershell
# Verifica que .env.local existe
cat .env.local

# Deberías ver GOOGLE_CREDENTIALS con el JSON completo
```

### Error: "Configuración de Google Sheets inválida"

**Causa:** El JSON de credenciales está mal formado

**Solución:**
- Asegúrate de que `GOOGLE_CREDENTIALS` sea un JSON válido en **una sola línea**
- Sin saltos de línea en la `private_key`
- El formato debe ser: `{"type":"service_account",...}`

### La app no guarda en el Sheet

**Verifica:**
1. El Sheet está compartido con: `formulario-medico-cuenta-servi@formularios-medicos-491901.iam.gserviceaccount.com`
2. El permiso es **Editor** (no solo lector)
3. La Sheets API está habilitada en Google Cloud Console

---

## 📱 AGREGAR A PANTALLA DE INICIO (Móvil)

### iOS Safari
1. Abre la app en Safari
2. Botón **Compartir** (cuadrado con flecha)
3. **"Agregar al inicio"**

### Android Chrome
1. Abre la app en Chrome
2. Menú (3 puntos)
3. **"Agregar a pantalla principal"**

---

## 📊 MONITOREO

### Logs en Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Click en **Functions**
4. Selecciona una función (ej: `guardar-fila`)
5. Verás logs en tiempo real

### Google Cloud Console

1. Ve a https://console.cloud.google.com/apis/api/sheets.googleapis.com
2. Verás estadísticas de llamadas a la API
3. Útil para debugging de errores de permisos

---

## 🆘 NECESITAS AYUDA?

### Recursos:
- **README.md:** Documentación completa del proyecto
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Google Cloud Console:** https://console.cloud.google.com

### Check rápido:
- [ ] `npm install` se ejecutó sin errores
- [ ] `.env.local` existe y tiene las credenciales
- [ ] El Sheet está compartido con el Service Account
- [ ] Sheets API está habilitada en Google Cloud

---

## ✨ ¡LISTO!

Tu app médica está funcionando con:
- ✅ **Cerebro médico** que evalúa riesgos automáticamente
- ✅ **Caché offline** completo con IndexedDB
- ✅ **Auto-save** al navegar entre pacientes
- ✅ **Reintentos** automáticos (3 intentos)
- ✅ **Diseño mobile-first** con colores de salud holística

**URLs importantes:**
- Local: `http://localhost:3000`
- Producción: `https://TU-PROYECTO.vercel.app`
