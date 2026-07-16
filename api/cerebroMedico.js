/**
 * CEREBRO MÉDICO - Lógica de evaluación médica
 * Misma lógica exacta que el script del formulario
 */

/**
 * Procesa una fila y devuelve todos los cálculos médicos
 * @param {Array} datos - Array de la fila completa (63 columnas, índice 0-62)
 * @returns {Object} Objeto con todos los resultados calculados
 */
function procesarCerebroMedico(datos) {
  // Funciones de limpieza
  const soloNumeros = (t) => {
    return t ? t.toString().replace(/\D/g, '') : '';
  };

  const limpiarTxt = (t) => {
    return t
      ? t
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
      : '';
  };

  const limpiarNumRelativo = (t) => {
    if (!t) return '0';
    return t.toString().replace(/[^\d,.-]/g, '').replace(/[.-]/g, ',').trim();
  };

  // --- 1. LIMPIEZA DE EDAD Y DNI ---
  const edadLimpia = soloNumeros(datos[2]); // Columna C (índice 2)
  const dniLimpio = soloNumeros(datos[4]); // Columna E (índice 4)

  // --- 2. CÁLCULO DE ETAPA ---
  const edad = parseInt(edadLimpia) || 0;
  let etapa = 'Sin datos';
  if (edad > 0) {
    if (edad <= 8) etapa = 'Niños';
    else if (edad <= 12) etapa = 'Prepúber';
    else if (edad <= 17) etapa = 'Adolescentes';
    else if (edad <= 30) etapa = 'Jóvenes';
    else if (edad <= 59) etapa = 'Adultos';
    else if (edad <= 74) etapa = 'Adultos mayores';
    else etapa = 'Vejez';
  }

  // --- 3. CÁLCULO DE IMC ---
  const peso = parseFloat(limpiarNumRelativo(datos[11]).replace(',', '.')) || 0;
  const alturaRaw = parseFloat(limpiarNumRelativo(datos[12]).replace(',', '.')) || 0;
  let imcNum = 0;
  let imcTexto = 'Sin datos';

  if (alturaRaw > 0 && peso > 0) {
    const altura = alturaRaw > 3 ? alturaRaw / 100 : alturaRaw;
    imcNum = parseFloat((peso / (altura * altura)).toFixed(2));
    if (imcNum < 18.5) imcTexto = 'Bajo peso';
    else if (imcNum <= 25.3) imcTexto = 'Peso normal';
    else if (imcNum <= 29.9) imcTexto = 'Sobrepeso';
    else imcTexto = 'Obesidad';
  }

  // --- 4. EVALUACIÓN DE RIESGO ---
  const motivos = [];

  // "NO APLICA" tiene prioridad absoluta: si un campo lo contiene, se ignora para riesgo
  // "NO APLICA" tiene prioridad absoluta: si un campo lo contiene, se ignora para riesgo
  const esNoAplica = (idx) => {
    const v = datos[idx];
    if (!v) return false;
    const txt = limpiarTxt(v);
    return (
      txt.includes('no aplica') || 
      txt.includes('noaplica') || 
      txt === 'na' || 
      txt === 'n/a'
    );
  };

  // A. Búsqueda por Palabras Clave
  const reglas = [
    {
      indices: [31],
      raices: ['hiper', 'hiperten', 'corazon', 'coraz', 'presion alta', 'trombosis', 'stent', 'esten', 'angi', 'aorta', 'marcapaso'],
      nombre: 'Cardiovascular',
    },
    {
      indices: [30],
      raices: ['epoc', 'severa', 'asma'],
      nombre: 'Respiratorio',
    },
    {
      indices: [33],
      raices: ['grave', 'severa', 'cronica'],
      nombre: 'Osteoarticular/Muscular',
    },
    {
      indices: [34],
      raices: ['silla de ruedas', 'persona al cuidado'],
      nombre: 'Movilidad',
    },
    {
      indices: [35],
      raices: ['diabet', 'colesterol alto', 'trigliceridos alto', 'alto', 'trigliceridos', 'colesterol', 'severa'],
      nombre: 'Metabólico/Glandular',
    },
    {
      indices: [36],
      raices: ['severa'],
      nombre: 'Digestivo',
    },
    {
      indices: [40],
      raices: ['discapacidad', 'deterioro', 'severa', 'acv', 'acb'],
      nombre: 'Neurológico',
    },
    {
      indices: [43],
      raices: ['severa'],
      nombre: 'Ocular/Otros',
    },
  ];

  for (const regla of reglas) {
    for (const idx of regla.indices) {
      if (esNoAplica(idx)) continue;
      const texto = limpiarTxt(datos[idx]);
      if (regla.raices.some((r) => texto.indexOf(r) !== -1)) {
        if (motivos.indexOf(regla.nombre) === -1) motivos.push(regla.nombre);
      }
    }
  }

  // B. Campos abiertos (Oncológicas 39, Psicológicas 47)
  for (const idx of [39, 47]) {
    if (esNoAplica(idx)) continue; // SALTA SOLO ESTE CAMPO
    const txt = limpiarTxt(datos[idx]);
    const nombre = idx === 39 ? 'Oncológico' : 'Psicológico/Psiquiátrico';
    if (txt.length >= 2 && txt !== 'no' && txt !== 'ninguna' && txt !== 'ninguno' && txt !== 'ningun') {
      motivos.push(nombre);
    }
  }

  // C. Campos de "SÍ" directo
  const camposSi = [
    { idx: 45, label: 'Secuelas ACV' },
    { idx: 46, label: 'Epilepsia/Convulsiones' },
    { idx: 48, label: 'Anorexia' },
    { idx: 49, label: 'Bulimia' },
    { idx: 32, label: 'Anticoagulantes' },
    { idx: 52, label: 'Autoevaluación de Riesgo' },
  ];

  for (const campo of camposSi) {
    if (esNoAplica(campo.idx)) continue; // SALTA SOLO ESTE CAMPO
    if (limpiarTxt(datos[campo.idx]).indexOf('si') !== -1) {
      motivos.push(campo.label);
    }
  }

  // D. Adicciones (índice 50)
  if (!esNoAplica(50)) {
    const txtAdic = limpiarTxt(datos[50]);
    if (txtAdic.indexOf('cocaina') !== -1) motivos.push('Adicción: Cocaína');
    if (txtAdic.indexOf('actual') !== -1 || txtAdic.indexOf('fecha') !== -1 || txtAdic.indexOf('hoy') !== -1) {
      motivos.push('Adicción: Consumo Actual');
    }
  }

  // E. Edad y IMC
  if (edad >= 70) motivos.push('Edad (>=70)');
  if (imcTexto === 'Obesidad') motivos.push('Obesidad (IMC >= 30)');

  // --- 5. RETORNAR RESULTADOS ---
  return {
    edadLimpia: edadLimpia,
    dniLimpio: dniLimpio,
    etapa: etapa,
    imcNum: imcNum.toString().replace('.', ','),
    imcTexto: imcTexto,
    riesgo: motivos.length > 0 ? 'SÍ' : 'NO',
    motivo: motivos.length > 0 ? motivos.join(', ') : 'Sin riesgos detectados',
  };
}

module.exports = {
  procesarCerebroMedico,
};
