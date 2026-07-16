# Guía de Implementación UI/UX: Control Médico Premium

Esta guía detalla los lineamientos exactos seguidos para la creación de la interfaz y la experiencia de usuario de la aplicación "Control Médico". El objetivo es que otro agente pueda replicar la aplicación manteniendo la misma coherencia visual, técnica y funcional.

---

## 1. Fundamentos del Diseño (Design System)

### Paleta de Colores (Variables CSS)
Se utiliza una paleta basada en azules clínicos con acentos semánticos para estados de riesgo:
*   **Fondo General**: `#F0F4FF` (Un azul muy suave que reduce la fatiga visual).
*   **Primario (Acción)**: `#2563EB` (Blue 600) / `#1d4ed8` (Hover).
*   **Éxito (Sin Riesgo)**: `#10B981` (Green 500).
*   **Peligro (Riesgo)**: `#EF4444` (Red 500).
*   **Superficies (Cards)**: `#FFFFFF`.
*   **Texto Principal**: `#1E293B` (Slate 800).
*   **Texto Secundario/Muted**: `#64748B` (Slate 500).

### Tipografía y Espaciado
*   **Fuente**: `'Inter', sans-serif` (Google Fonts). Prioriza la legibilidad en datos médicos.
*   **Radio de Borde**: `12px` para consistencia en botones, inputs y cards.
*   **Sombras**: `0 2px 12px rgba(37,99,235,.10)` para dar profundidad sin ensuciar la UI.

---

## 2. Estructura de la Interfaz (Layout)

### Navegación y Headers
1.  **Sticky Header**: Siempre visible en la parte superior. Muestra el nombre del Revisor y un Badge con el conteo total de registros.
2.  **Sticky Search Bar**: Debajo del header principal. Debe ser reactiva (filtra mientras escribes) y tener un botón para limpiar el texto rápidamente.
3.  **Controles de Navegación**: Botones de "Anterior" y "Siguiente" tanto arriba como abajo de la ficha del paciente para facilitar el flujo de corrección.

### El "Desplegable" de Secciones (Accordions)
Debido a la gran cantidad de campos (63+), la UI se organiza en **Secciones Colapsables**:
*   **Comportamiento**: Solo una sección puede estar abierta por defecto (la primera). Las demás se expanden/contraen al hacer clic en el encabezado.
*   **Estética**: El encabezado de la sección (`.section-toggle`) incluye un ícono/emoji y una flecha indicadora de estado que rota 180° al abrirse.

---

## 3. Manejo de Campos (Inputs & Logic)

Es crítico seguir este formato para los campos de datos:

### Jerarquía Visual de Campos
1.  **Labels**: Siempre en mayúsculas, tamaño pequeño (`0.72rem`), negrita y con ligero espaciado entre letras (`letter-spacing`). Color muted.
2.  **Inputs/Textareas**: Borde de `1.5px`. Al recibir foco, el borde cambia al color azul primario.
3.  **Lógica Long-Text**: Si el contenido del campo supera los 60 caracteres o el nombre del campo es muy largo, se debe renderizar un `textarea` en lugar de un `input`.

### Tipos de Campos Especiales
*   **Campos de Solo Lectura (Readonly)**: Fondo gris suave. No permiten edición manual por seguridad.
*   **Campos Calculados (Blue Highlight)**: Campos como el IMC o la Etapa de vida. Se muestran con fondo azul claro y texto azul intenso para indicar que son valores derivados de la lógica del sistema.

---

## 4. Experiencia de Usuario (UX) Elevada

### Auto-Guardado Inteligente
El usuario **nunca** debe presionar un botón de "Guardar". El sistema debe:
1.  Detectar cambios en los inputs (`input` event).
2.  Sincronizar los cambios con el servidor automáticamente al:
    *   Cambiar de paciente (Navegación).
    *   Realizar una búsqueda.
    *   Cambiar de pestaña.
3.  **Feedback Visual**: Mostrar un "Toast" (notificación flotante) en la parte inferior indicando "💾 Guardando...", "✅ Guardado" o "❌ Error".

### Feedback de Riesgo
La ficha debe mostrar un **Badge de Riesgo** dinámico en la cabecera:
*   Si el paciente es de riesgo: Fondo rojo suave, texto rojo, ícono de advertencia y listado de motivos.
*   Si no hay riesgo: Fondo verde suave, texto verde y mensaje positivo.

### Estados de Carga
*   **Overlay de Carga**: Un fondo azul semitransparente con un spinner grande y mensajes descriptivos (ej: "Sincronizando con el servidor...") para bloquear la UI durante procesos críticos y evitar pérdida de datos.

---

## 5. Arquitectura de Datos (Frontend/Backend)

*   **Paginación Virtual**: No cargar cientos de HTMLs. Cargar todos los registros asignados en un array de JavaScript (`STATE.allRecords`) y renderizar dinámicamente solo la ficha activa.
*   **Búsqueda Dual**: La búsqueda debe filtrar sobre los datos cargados localmente para una respuesta instantánea (0ms de latencia).

---

> [!IMPORTANT]
> **Regla de Oro**: La interfaz debe sentirse como una herramienta profesional, limpia y extremadamente rápida. El uso de degradados suaves en las cabeceras de las tarjetas y micro-animaciones en los botones es lo que diferencia esta app de un formulario médico básico de uno Premium.
