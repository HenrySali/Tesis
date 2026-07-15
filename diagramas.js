/**
 * Diagramas de flujo dibujados con pdfkit nativo
 * Exporta funciones que reciben (doc, x, y, width) y dibujan cada diagrama
 */

const COLORS = {
  box: '#2c3e50',
  boxFill: '#f8f9fa',
  decision: '#e67e22',
  decisionFill: '#fef9e7',
  start: '#27ae60',
  startFill: '#eafaf1',
  end: '#c0392b',
  endFill: '#fdedec',
  arrow: '#333',
  text: '#000',
  label: '#666'
};

// Helpers
function box(doc, x, y, w, h, text, opts = {}) {
  const fill = opts.fill || COLORS.boxFill;
  const stroke = opts.stroke || COLORS.box;
  const r = opts.radius || 3;
  // Dynamic height: calculate real text height
  doc.font('Times-Roman').fontSize(6.5);
  const textH = doc.heightOfString(text, { width: w - 10 });
  const realH = Math.max(h, textH + 10); // 5px padding top + 5px bottom
  doc.save();
  doc.roundedRect(x, y, w, realH, r).fill(fill);
  doc.roundedRect(x, y, w, realH, r).lineWidth(1).stroke(stroke);
  doc.restore();
  doc.fillColor(COLORS.text);
  doc.font('Times-Roman').fontSize(6.5);
  // Center text vertically
  const textY = y + (realH - textH) / 2;
  doc.text(text, x + 5, textY, { width: w - 10, align: 'center', lineGap: 0.5 });
  return y + realH;
}

function startBox(doc, x, y, w, text) {
  return box(doc, x, y, w, 20, text, { fill: COLORS.startFill, stroke: COLORS.start, radius: 10 });
}

function endBox(doc, x, y, w, text) {
  return box(doc, x, y, w, 20, text, { fill: COLORS.endFill, stroke: COLORS.end, radius: 10 });
}

function decision(doc, cx, cy, w, h, text) {
  // Diamond shape
  doc.save();
  doc.moveTo(cx, cy - h/2).lineTo(cx + w/2, cy).lineTo(cx, cy + h/2).lineTo(cx - w/2, cy).closePath();
  doc.fill(COLORS.decisionFill);
  doc.moveTo(cx, cy - h/2).lineTo(cx + w/2, cy).lineTo(cx, cy + h/2).lineTo(cx - w/2, cy).closePath();
  doc.lineWidth(1).stroke(COLORS.decision);
  doc.restore();
  doc.fillColor(COLORS.text).font('Times-Roman').fontSize(6);
  doc.text(text, cx - w/3, cy - 8, { width: w*2/3, align: 'center', lineGap: 0 });
}

function arrowDown(doc, x, y1, y2) {
  doc.save().moveTo(x, y1).lineTo(x, y2 - 4).lineWidth(0.8).stroke(COLORS.arrow);
  // Arrowhead
  doc.moveTo(x - 3, y2 - 6).lineTo(x, y2).lineTo(x + 3, y2 - 6).fill(COLORS.arrow);
  doc.restore();
}

function arrowRight(doc, x1, y, x2) {
  doc.save().moveTo(x1, y).lineTo(x2 - 4, y).lineWidth(0.8).stroke(COLORS.arrow);
  doc.moveTo(x2 - 6, y - 3).lineTo(x2, y).lineTo(x2 - 6, y + 3).fill(COLORS.arrow);
  doc.restore();
}

function arrowLeft(doc, x1, y, x2) {
  doc.save().moveTo(x1, y).lineTo(x2 + 4, y).lineWidth(0.8).stroke(COLORS.arrow);
  doc.moveTo(x2 + 6, y - 3).lineTo(x2, y).lineTo(x2 + 6, y + 3).fill(COLORS.arrow);
  doc.restore();
}

function label(doc, x, y, text) {
  doc.fillColor(COLORS.label).font('Times-Italic').fontSize(6);
  doc.text(text, x, y, { width: 30, align: 'center' });
  doc.fillColor(COLORS.text);
}

function lineDown(doc, x, y1, y2) {
  doc.save().moveTo(x, y1).lineTo(x, y2).lineWidth(0.8).stroke(COLORS.arrow).restore();
}

function lineRight(doc, x1, y, x2) {
  doc.save().moveTo(x1, y).lineTo(x2, y).lineWidth(0.8).stroke(COLORS.arrow).restore();
}

// ============================================
// B.1 Flujo Principal
// ============================================
function drawB1(doc, ox, oy, W) {
  const bw = 110; // box width
  const bh = 30;
  const gap = 14;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'INICIO: Ciclo de Medición');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'ESP8266 lee sensor\nDS18B20 (OneWire)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Decision: lectura válida
  const dy = y + 18;
  decision(doc, cx + bw/2, dy, 100, 36, '¿Lectura\nválida?');
  label(doc, cx + bw/2 + 52, dy - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 50, dy, cx + bw + 40);
  box(doc, cx + bw + 40, dy - 15, 80, bh, 'Reintentar\nlectura (3x)');
  label(doc, cx + bw/2 - 15, dy + 18, 'SÍ');
  y = dy + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Leer voltaje\nbatería (ADC)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Decision: WiFi
  const dy2 = y + 18;
  decision(doc, cx + bw/2, dy2, 100, 36, '¿Hay conexión\nWiFi?');
  label(doc, cx + bw/2 + 52, dy2 - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 50, dy2, cx + bw + 40);
  box(doc, cx + bw + 40, dy2 - 15, 80, bh, 'Almacenar dato\noffline (LittleFS)');
  label(doc, cx + bw/2 - 15, dy2 + 18, 'SÍ');
  y = dy2 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Enviar datos\nvía MQTT');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Servidor Node.js\nrecibe MQTT');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Insertar en MySQL\n(mediciones2)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Evaluar umbrales\n(temp/voltaje)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Branch
  const bx1 = cx - 30;
  const bx2 = cx + bw + 30;
  box(doc, bx1, y, 80, 24, 'Dentro de rango\nnormal');
  box(doc, bx2 - 30, y, 80, 24, 'Fuera de rango\n(excursión)');
  lineRight(doc, cx + bw/2 - 30, y - 2, bx1 + 40);
  lineRight(doc, cx + bw/2 + 30, y - 2, bx2 + 10);
  y += 24 + gap;

  y = box(doc, cx, y, bw, bh, 'Broadcast vía\nWebSocket a clientes');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Dashboard actualiza\ntabla en tiempo real');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, 24, 'Esperar intervalo (5 min)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  endBox(doc, cx, y, bw, 'Volver al INICIO');
  
  return y + 24;
}


// ============================================
// B.2 Flujo de Alertas
// ============================================
function drawB2(doc, ox, oy, W) {
  const bw = 110, bh = 30, gap = 14;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'Nueva medición recibida');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Obtener umbrales\ndel sensor (MySQL)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy = y + 18;
  decision(doc, cx + bw/2, dy, 110, 36, '¿Temperatura\ndentro de rango?');
  label(doc, cx + bw/2 + 58, dy - 5, 'SÍ');
  arrowRight(doc, cx + bw/2 + 55, dy, cx + bw + 40);
  endBox(doc, cx + bw + 40, dy - 10, 80, 'Registrar dato normal. FIN');
  label(doc, cx + bw/2 - 15, dy + 18, 'NO');
  y = dy + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy2 = y + 18;
  decision(doc, cx + bw/2, dy2, 110, 36, '¿Es primera\nexcursión?');
  label(doc, cx + bw/2 + 58, dy2 - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 55, dy2, cx + bw + 40);
  box(doc, cx + bw + 40, dy2 - 15, 80, bh, 'Incrementar\ncontador excursiones');
  label(doc, cx + bw/2 - 15, dy2 + 18, 'SÍ');
  y = dy2 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Crear evento\nsupervisión\ntipo: "excursión"');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Branch: WebSocket + correo
  const bx1 = cx - 30, bx2 = cx + bw + 30;
  box(doc, bx1, y, 80, 28, 'Notificar vía\nWebSocket\n(dashboard)');
  box(doc, bx2 - 30, y, 80, 28, 'Enviar correo\nelectrónico al\nresponsable');
  lineRight(doc, cx + bw/2 - 30, y - 2, bx1 + 40);
  lineRight(doc, cx + bw/2 + 30, y - 2, bx2 + 10);
  y += 28 + gap;

  y = box(doc, cx, y, bw, bh, 'Registrar en log\nde supervisiones');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy3 = y + 18;
  decision(doc, cx + bw/2, dy3, 110, 36, '¿Operador marca\ncomo resuelto?');
  label(doc, cx + bw/2 + 58, dy3 - 5, 'SÍ');
  arrowRight(doc, cx + bw/2 + 55, dy3, cx + bw + 40);
  endBox(doc, cx + bw + 40, dy3 - 10, 80, 'Cerrar evento. FIN');
  label(doc, cx + bw/2 - 15, dy3 + 18, 'NO');
  y = dy3 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  endBox(doc, cx, y, bw, 'Evento abierto.\nReenviar alerta');
  return y + 24;
}

// ============================================
// B.3 Flujo de Calibración
// ============================================
function drawB3(doc, ox, oy, W) {
  const bw = 110, bh = 30, gap = 12;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'Proceso de Calibración');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Colocar sensor SmartTemp\njunto a datalogger\nde referencia');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Registrar mediciones\nsimultáneas (mín. 12 hrs)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Exportar datos\ndatalogger (CSV)\ny SmartTemp (BD)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Emparejar lecturas\npor timestamp (±2 min)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Calcular error absoluto\nmedio y desviación estándar');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy = y + 18;
  decision(doc, cx + bw/2, dy, 110, 36, '¿Error medio\n≤ ±0.5°C?');
  label(doc, cx + bw/2 + 58, dy - 5, 'SÍ');
  arrowRight(doc, cx + bw/2 + 55, dy, cx + bw + 40);
  box(doc, cx + bw + 40, dy - 15, 80, bh, 'Sensor APROBADO\nRegistrar certificado', { fill: COLORS.startFill, stroke: COLORS.start });
  label(doc, cx + bw/2 - 15, dy + 18, 'NO');
  y = dy + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Calcular factor de\ncorrección (offset)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Aplicar corrección\nen configuración');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Repetir mediciones\nde validación');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy2 = y + 18;
  decision(doc, cx + bw/2, dy2, 110, 36, '¿Error corregido\n≤ ±0.5°C?');
  label(doc, cx + bw/2 + 58, dy2 - 5, 'SÍ');
  arrowRight(doc, cx + bw/2 + 55, dy2, cx + bw + 40);
  box(doc, cx + bw + 40, dy2 - 15, 80, bh, 'Sensor CALIBRADO\nEmitir certificado', { fill: COLORS.startFill, stroke: COLORS.start });
  label(doc, cx + bw/2 - 15, dy2 + 18, 'NO');
  y = dy2 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  endBox(doc, cx, y, bw, 'Reemplazar sensor.\nPosible falla hardware');
  return y + 24;
}

// ============================================
// B.4 Flujo Reconexión Offline
// ============================================
function drawB4(doc, ox, oy, W) {
  const bw = 110, bh = 30, gap = 12;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'Sensor detecta pérdida WiFi');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, 24, 'Cambiar a modo offline');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, 24, 'Continuar midiendo temperatura');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Almacenar en LittleFS\ncon timestamp RTC');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Intentar reconexión\nWiFi cada 30 seg');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy = y + 18;
  decision(doc, cx + bw/2, dy, 100, 36, '¿Reconexión\nexitosa?');
  label(doc, cx + bw/2 + 52, dy - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 50, dy, cx + bw + 30);
  doc.fillColor(COLORS.label).font('Times-Italic').fontSize(6);
  doc.text('(reintentar)', cx + bw + 32, dy - 3);
  label(doc, cx + bw/2 - 15, dy + 18, 'SÍ');
  y = dy + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, 24, 'Sincronizar reloj NTP');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Leer datos almacenados\nen LittleFS');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Enviar datos offline\nal servidor (batch MQTT)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy2 = y + 18;
  decision(doc, cx + bw/2, dy2, 110, 36, '¿Servidor confirma\nrecepción?');
  label(doc, cx + bw/2 + 58, dy2 - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 55, dy2, cx + bw + 40);
  box(doc, cx + bw + 40, dy2 - 15, 80, 24, 'Reintentar envío\nen próximo ciclo');
  label(doc, cx + bw/2 - 15, dy2 + 18, 'SÍ');
  y = dy2 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, 24, 'Borrar datos de LittleFS');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  endBox(doc, cx, y, bw, 'Reanudar modo online');
  return y + 24;
}

// (exports al final del archivo)


// ============================================
// B.5a Flujo de Configuración de Períodos de Medición
// ============================================
function drawConfigPeriodos(doc, ox, oy, W) {
  const bw = 110, bh = 30, gap = 14;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'Configuración de Período de Medición');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Operador accede al\npanel de Diagnóstico\n(interfaz web)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Seleccionar sensor\no sector a configurar');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Ingresar nuevo intervalo\n(5 a 60 minutos)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy = y + 18;
  decision(doc, cx + bw/2, dy, 110, 36, '¿Intervalo\nválido?');
  label(doc, cx + bw/2 + 58, dy - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 55, dy, cx + bw + 40);
  box(doc, cx + bw + 40, dy - 15, 80, bh, 'Mostrar error:\nrango 5-60 min', { fill: '#fdedec', stroke: '#c0392b' });
  label(doc, cx + bw/2 - 15, dy + 18, 'SÍ');
  y = dy + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Servidor envía comando\nvía MQTT topic:\nsensores/config/{id}');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy2 = y + 18;
  decision(doc, cx + bw/2, dy2, 110, 36, '¿Sensor\nconectado?');
  label(doc, cx + bw/2 + 58, dy2 - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 55, dy2, cx + bw + 40);
  box(doc, cx + bw + 40, dy2 - 15, 80, bh, 'Encolar comando.\nReintentar al\nreconectar');
  label(doc, cx + bw/2 - 15, dy2 + 18, 'SÍ');
  y = dy2 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'ESP8266 recibe\nconfiguración MQTT\ny actualiza intervalo');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Guardar nuevo intervalo\nen EEPROM\n(persistente)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Registrar cambio en\nsensor_config_history\n(MySQL)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, 24, 'Sensor opera con\nnuevo intervalo', { fill: COLORS.startFill, stroke: COLORS.start });
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  endBox(doc, cx, y, bw, 'FIN');
  return y + 24;
}

// ============================================
// B.5b Flujo de Configuración de Umbrales
// ============================================
function drawConfigUmbrales(doc, ox, oy, W) {
  const bw = 110, bh = 30, gap = 14;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'Configuración de Umbrales');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Operador accede al\npanel de Ajustes\n(interfaz web)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Seleccionar sensor\na configurar');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, 38, 'Ingresar umbrales:\n• Temp. mínima\n• Temp. máxima\n• Voltaje mínimo');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy = y + 18;
  decision(doc, cx + bw/2, dy, 110, 36, '¿Temp. mín\n< Temp. máx?');
  label(doc, cx + bw/2 + 58, dy - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 55, dy, cx + bw + 40);
  box(doc, cx + bw + 40, dy - 15, 80, bh, 'Mostrar error:\numbrales inválidos', { fill: '#fdedec', stroke: '#c0392b' });
  label(doc, cx + bw/2 - 15, dy + 18, 'SÍ');
  y = dy + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'PUT /api/umbrales/{id}\nActualizar en MySQL\ntabla: umbrales');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Invalidar caché\nde umbrales\n(5 min TTL)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Notificar vía\nWebSocket a\nclientes conectados');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Branch: evaluación inmediata
  y = box(doc, cx, y, bw, bh, 'Reevaluar última\nmedición del sensor\ncon nuevos umbrales');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy2 = y + 18;
  decision(doc, cx + bw/2, dy2, 120, 36, '¿Última medición\nfuera de rango?');
  label(doc, cx + bw/2 + 62, dy2 - 5, 'SÍ');
  arrowRight(doc, cx + bw/2 + 60, dy2, cx + bw + 40);
  box(doc, cx + bw + 40, dy2 - 15, 80, bh, 'Generar alerta\ninmediata\n(supervisión)');
  label(doc, cx + bw/2 - 15, dy2 + 18, 'NO');
  y = dy2 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, 24, 'Dashboard actualiza\ncoloreo de tabla', { fill: COLORS.startFill, stroke: COLORS.start });
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  endBox(doc, cx, y, bw, 'FIN');
  return y + 24;
}

// (exports al final)


// ============================================
// B.5c Flujo del Sensor Virtual / Simulador
// ============================================
function drawSimulador(doc, ox, oy, W) {
  const bw = 110, bh = 30, gap = 12;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'Sensor Virtual: Inicio');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Cargar configuración\ndesde JSON persistido\ny sensor_config (BD)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy0 = y + 18;
  decision(doc, cx + bw/2, dy0, 110, 36, '¿Config en BD\ndisponible?');
  label(doc, cx + bw/2 + 58, dy0 - 5, 'SÍ');
  arrowRight(doc, cx + bw/2 + 55, dy0, cx + bw + 40);
  box(doc, cx + bw + 40, dy0 - 15, 80, bh, 'BD prima sobre JSON:\nmodo, intervalo,\numbral voltaje');
  label(doc, cx + bw/2 - 15, dy0 + 18, 'NO');
  y = dy0 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Crear instancia\nfirmware-virtual\n(emula ESP8266)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Modo
  const dy1 = y + 18;
  decision(doc, cx + bw/2, dy1, 110, 36, '¿Voltaje >\numbral (3.6V)?');
  label(doc, cx + bw/2 - 60, dy1 - 5, 'SÍ');
  arrowLeft(doc, cx + bw/2 - 50, dy1, cx - 40);
  box(doc, cx - 120, dy1 - 12, 80, 24, 'Modo continuo\n(siempre activo)', { fill: '#eaf2f8', stroke: '#2980b9' });
  label(doc, cx + bw/2 + 58, dy1 - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 55, dy1, cx + bw + 40);
  box(doc, cx + bw + 40, dy1 - 12, 80, 24, 'Modo deep sleep\n(ciclos)', { fill: '#fef9e7', stroke: '#f39c12' });
  y = dy1 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Conectar MQTT\nSuscribir topics:\nping, config, reset');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Ciclo principal
  y = box(doc, cx, y, bw, 24, 'CICLO: Generar medición\n(temp ± ruido aleatorio)', { fill: '#eaf2f8', stroke: '#2980b9' });
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy2 = y + 18;
  decision(doc, cx + bw/2, dy2, 110, 36, '¿WiFi\nsimulado ON?');
  label(doc, cx + bw/2 + 58, dy2 - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 55, dy2, cx + bw + 40);
  box(doc, cx + bw + 40, dy2 - 15, 80, bh, 'Almacenar dato\noffline (memoria)\ncon timestamp');
  label(doc, cx + bw/2 - 15, dy2 + 18, 'SÍ');
  y = dy2 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy3 = y + 18;
  decision(doc, cx + bw/2, dy3, 110, 36, '¿Sensor DS18B20\nconectado?');
  label(doc, cx + bw/2 + 58, dy3 - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 55, dy3, cx + bw + 40);
  box(doc, cx + bw + 40, dy3 - 15, 80, bh, 'Enviar temp=0.1111\nsensorConnected\n=false');
  label(doc, cx + bw/2 - 15, dy3 + 18, 'SÍ');
  y = dy3 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Enviar datos vía\nMQTT publish\ntopic: sensores/data');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, 24, 'Esperar intervalo\nconfigurable (5-60 min)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  endBox(doc, cx, y, bw, 'Volver al CICLO');

  return y + 24;
}


// ============================================
// B.8 Flujo de la Consola de Log del Servidor
// ============================================
function drawConsolaServidor(doc, ox, oy, W) {
  const bw = 110, bh = 30, gap = 12;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'Consola del Servidor');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Operador abre panel\nde Diagnóstico\n(sección 5)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'GET /api/server-logs\nObtener logs del\nbackend Node.js');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Servidor retorna\núltimas 50 entradas\nde log con timestamp');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, 38, 'Renderizar logs con\ncolores por nivel:\n• info = azul\n• warning = amarillo\n• error = rojo');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Ciclo auto-actualización
  y = box(doc, cx, y, bw, 24, 'Auto-actualización\ncada 5 segundos', { fill: '#eaf2f8', stroke: '#2980b9' });
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy = y + 18;
  decision(doc, cx + bw/2, dy, 100, 36, '¿Consola\npausada?');
  label(doc, cx + bw/2 + 52, dy - 5, 'SÍ');
  arrowRight(doc, cx + bw/2 + 50, dy, cx + bw + 30);
  box(doc, cx + bw + 30, dy - 12, 80, 24, 'Mantener últimos\nlogs visibles');
  label(doc, cx + bw/2 - 15, dy + 18, 'NO');
  y = dy + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'Solicitar nuevos logs\nGET /api/server-logs\n(polling cada 5s)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  endBox(doc, cx, y, bw, 'Volver al ciclo');
  return y + 24;
}

// ============================================
// B.9 Flujo de Verificación de Red
// ============================================
function drawVerificacionRed(doc, ox, oy, W) {
  const bw = 110, bh = 30, gap = 12;
  const cx = ox + W/2 - bw/2;
  let y = oy;

  y = startBox(doc, cx, y, bw, 'Verificación de Red');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Registro de eventos\nen tiempo real vía\nWebSocket (sección 4)');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Operador presiona\n"Verificar Red"');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'GET /api/mediciones2\nObtener última medición\nde cada sensor');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;
  y = box(doc, cx, y, bw, bh, 'Calcular % sensores\nsin actividad en\núltimos 7 minutos');
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy = y + 18;
  decision(doc, cx + bw/2, dy, 120, 36, '¿> 40% sensores\ndesconectados?');
  label(doc, cx + bw/2 + 62, dy - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 60, dy, cx + bw + 40);
  box(doc, cx + bw + 40, dy - 12, 80, 24, 'Red OK\n(estado normal)', { fill: COLORS.startFill, stroke: COLORS.start });
  label(doc, cx + bw/2 - 15, dy + 18, 'SÍ');
  y = dy + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  const dy2 = y + 18;
  decision(doc, cx + bw/2, dy2, 120, 36, '¿Sin actividad\nen 15 minutos?');
  label(doc, cx + bw/2 + 62, dy2 - 5, 'NO');
  arrowRight(doc, cx + bw/2 + 60, dy2, cx + bw + 40);
  box(doc, cx + bw + 40, dy2 - 12, 80, 24, 'Sensores con\nproblemas parciales');
  label(doc, cx + bw/2 - 15, dy2 + 18, 'SÍ');
  y = dy2 + 36/2;
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  y = box(doc, cx, y, bw, bh, 'ALERTA: Red caída\nNotificar en log\ncon nivel ERROR', { fill: '#fdedec', stroke: '#c0392b' });
  arrowDown(doc, cx + bw/2, y, y + gap); y += gap;

  // Branch
  const bx1 = cx - 30, bx2 = cx + bw + 30;
  box(doc, bx1, y, 80, 28, 'Mostrar alerta\nen dashboard\n(banner rojo)');
  box(doc, bx2 - 30, y, 80, 28, 'Registrar evento\nen log con\ntimestamp');
  lineRight(doc, cx + bw/2 - 30, y - 2, bx1 + 40);
  lineRight(doc, cx + bw/2 + 30, y - 2, bx2 + 10);
  y += 28 + gap;

  endBox(doc, cx, y, bw, 'Operador investiga\ncausa de la caída');
  return y + 24;
}

// (exports al final del archivo)


// ============================================
// C.1 Registro de Sensores (con auto-detección)
// ============================================
function drawRegistroSensores(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Registro de Sensor');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'ESP8266 envía datos\npor primera vez\n(POST /data)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Servidor registra en\nsensores_detectados\n(registro=NULL)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin abre panel\nGestión de Sensores');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Selector muestra\nsensores detectados\nsin registrar');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Completar: nombre,\ndescripción, tipo,\nubicación');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'POST /api/sensores\nINSERT en tabla\nsensores');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'UPDATE sensores_detectados\nSET registro=\'registrado\'');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Sensor registrado');
  return y+24;
}

// ============================================
// C.2 Registro de Equipos
// ============================================
function drawRegistroEquipos(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Registro de Equipo');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin abre panel\nGestión de Equipos');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,38,'Completar datos:\n• Nombre\n• Descripción\n• Tipo (heladera/freezer)\n• Ubicación\n• MAC address');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  const dy=y+18;
  decision(doc,cx+bw/2,dy,100,36,'¿Nombre\núnico?');
  label(doc,cx+bw/2+52,dy-5,'NO');
  arrowRight(doc,cx+bw/2+50,dy,cx+bw+30);
  box(doc,cx+bw+30,dy-12,80,24,'Error: equipo\nya existe',{fill:'#fdedec',stroke:'#c0392b'});
  label(doc,cx+bw/2-15,dy+18,'SÍ');
  y=dy+36/2;arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'POST /api/equipos\nINSERT en tabla equipos');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Equipo registrado');
  return y+24;
}

// ============================================
// C.3 Registro de Sectores
// ============================================
function drawRegistroSectores(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Registro de Sector');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin abre panel\nGestión de Equipos\n(sección Sectores)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Ingresar nombre\ny color hexadecimal\n(ej: #ff6600)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'POST /api/sectores\nINSERT en tabla sectores');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Color se usa en tablas\npara identificar sector');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Sector registrado');
  return y+24;
}

// ============================================
// C.4 Registro de Usuarios
// ============================================
function drawRegistroUsuarios(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Registro de Usuario');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin abre panel\nde Usuarios');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,38,'Completar datos:\n• Nombre de usuario\n• Email\n• Contraseña\n• Rol (admin/coord/oper)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'POST /api/users\nHash bcrypt de\ncontraseña');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'INSERT en tabla users\ncon rol asignado');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Usuario registrado');
  return y+24;
}

// ============================================
// C.5 Asociación Sensor ↔ Equipo
// ============================================
function drawAsocSensorEquipo(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Asociar Sensor a Equipo');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin abre panel\nGestión de Sensores');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Seleccionar sensor\nregistrado de la lista');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Seleccionar equipo\ndestino (búsqueda\npor nombre)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'POST /api/sensor_equipos\nINSERT relación\n(sensor_id, equipo_id)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Sensor hereda sector\ndel equipo asociado');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Asociación creada');
  return y+24;
}

// ============================================
// C.6 Asociación Equipo ↔ Sector
// ============================================
function drawAsocEquipoSector(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Asociar Equipo a Sector');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin abre panel\nGestión de Equipos');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Seleccionar equipo\nde la lista');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Seleccionar sector\ndestino (búsqueda\npor nombre)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'POST /api/sector_equipos\nINSERT relación\n(sector, equipo)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Sensores del equipo\nheredan el sector');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Asociación creada');
  return y+24;
}

// ============================================
// C.7 Asociación Sector ↔ Usuario (RBAC)
// ============================================
function drawAsocSectorUsuario(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Asignar Sector a Usuario');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin abre panel\nde Usuarios');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Seleccionar usuario\n(coordinador u\noperador)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Seleccionar sectores\na asignar\n(múltiple selección)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'INSERT user_sectors\n(user_id, sector_id)\npor cada sector');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,38,'Usuario accede solo a:\nSectores asignados →\nEquipos del sector →\nSensores del equipo');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Permisos configurados');
  return y+24;
}

module.exports = { drawB1, drawB2, drawB3, drawB4, drawConfigPeriodos, drawConfigUmbrales, drawSimulador, drawConsolaServidor, drawVerificacionRed, drawRegistroSensores, drawRegistroEquipos, drawRegistroSectores, drawRegistroUsuarios, drawAsocSensorEquipo, drawAsocEquipoSector, drawAsocSectorUsuario, drawEliminacionSensor, drawEliminacionEquipo, drawEliminacionSector, drawLoginPerfiles, drawAlcancePerfiles, drawFlujoWebSocket, drawWsCentralizado, drawWsDatosCentrales, drawWsEnhanced, drawWsServerLogs, drawAuditoria };


// ============================================
// C.8 Eliminación de Sensor (cascada)
// ============================================
function drawEliminacionSensor(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Eliminar Sensor');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin selecciona\nsensor a eliminar');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  const dy=y+18;
  decision(doc,cx+bw/2,dy,110,36,'¿Confirma\neliminación?');
  label(doc,cx+bw/2+58,dy-5,'NO');
  arrowRight(doc,cx+bw/2+55,dy,cx+bw+40);
  endBox(doc,cx+bw+40,dy-10,80,'Cancelar');
  label(doc,cx+bw/2-15,dy+18,'SÍ');
  y=dy+36/2;arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'DELETE /api/sensores/:id');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,60,'Limpieza en cascada\n(9 tablas):\n• sensor_equipos\n• umbrales\n• Fcorreccion\n• eventos\n• correos_novedades\n• sensorip\n• sensorip_historial\n• sensor_events',{fill:'#fdedec',stroke:'#c0392b'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'sensores_detectados\nSET registro=NULL\n(permite re-registro)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Sensor eliminado');
  return y+24;
}

// ============================================
// C.9 Eliminación de Equipo (cascada)
// ============================================
function drawEliminacionEquipo(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Eliminar Equipo');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin selecciona\nequipo a eliminar');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  const dy=y+18;
  decision(doc,cx+bw/2,dy,110,36,'¿Tiene sensores\nasociados?');
  label(doc,cx+bw/2+58,dy-5,'SÍ');
  arrowRight(doc,cx+bw/2+55,dy,cx+bw+40);
  box(doc,cx+bw+40,dy-12,80,24,'Advertencia:\nse perderán\nasociaciones');
  label(doc,cx+bw/2-15,dy+18,'NO');
  y=dy+36/2;arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'DELETE /api/equipos/:id');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Limpieza cascada:\n• sector_equipos\n• sensor_equipos',{fill:'#fdedec',stroke:'#c0392b'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Equipo eliminado');
  return y+24;
}

// ============================================
// C.10 Eliminación de Sector (cascada)
// ============================================
function drawEliminacionSector(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Eliminar Sector');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Admin selecciona\nsector a eliminar');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  const dy=y+18;
  decision(doc,cx+bw/2,dy,110,36,'¿Tiene equipos\ny/o usuarios?');
  label(doc,cx+bw/2+58,dy-5,'SÍ');
  arrowRight(doc,cx+bw/2+55,dy,cx+bw+40);
  box(doc,cx+bw+40,dy-12,80,24,'Advertencia:\nse perderán\npermisos RBAC');
  label(doc,cx+bw/2-15,dy+18,'NO');
  y=dy+36/2;arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'DELETE /api/sectores/:id');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Limpieza cascada:\n• user_sectors\n• sector_equipos',{fill:'#fdedec',stroke:'#c0392b'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Usuarios pierden\nacceso a sensores\ndel sector');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Sector eliminado');
  return y+24;
}


// ============================================
// C.11 Login y Redirección por Perfil
// ============================================
function drawLoginPerfiles(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Login al Sistema');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Usuario ingresa\ncredenciales\n(email + contraseña)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'POST /api/login\nVerificar hash bcrypt\nen tabla users');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  const dy=y+18;
  decision(doc,cx+bw/2,dy,100,36,'¿Credenciales\nválidas?');
  label(doc,cx+bw/2+52,dy-5,'NO');
  arrowRight(doc,cx+bw/2+50,dy,cx+bw+30);
  box(doc,cx+bw+30,dy-12,80,24,'Error: credenciales\ninválidas',{fill:'#fdedec',stroke:'#c0392b'});
  label(doc,cx+bw/2-15,dy+18,'SÍ');
  y=dy+36/2;arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  y=box(doc,cx,y,bw,bh,'Guardar sesión:\nuserRole, userName,\nuserEmail en\nsessionStorage');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Registrar sesión en\nhistorial_sesiones (BD)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Branch por rol
  y=box(doc,cx-10,y,bw+20,20,'Redirección según rol',{fill:'#eaf2f8',stroke:'#2980b9'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // 3 ramas
  const bx1=ox+10, bx2=cx, bx3=ox+W-90;
  lineRight(doc,cx+bw/2-50,y-2,bx1+40);
  lineRight(doc,cx+bw/2+50,y-2,bx3+40);

  box(doc,bx1,y,85,55,'ADMINISTRADOR\n\nTodos los sensores\nCRUD completo\nConfiguracion\nDiagnostico\nGestion usuarios',{fill:'#eafaf1',stroke:'#27ae60'});
  box(doc,bx2,y,85,55,'COORDINADOR\n\nSensores de sus\nsectores\nSupervisar\nRegistrar eventos\nConfigurar',{fill:'#fef9e7',stroke:'#f39c12'});
  box(doc,bx3,y,85,55,'OPERADOR\n\nSensores de sus\nsectores\nSolo lectura\nSupervision basica',{fill:'#fdf2e9',stroke:'#e67e22'});
  y+=50+gap;

  // Destinos
  box(doc,bx1,y,85,20,'administrador.html',{fill:'#eafaf1',stroke:'#27ae60'});
  box(doc,bx2,y,85,20,'perfil_coordinador/',{fill:'#fef9e7',stroke:'#f39c12'});
  box(doc,bx3,y,85,20,'operador/sensor4.html',{fill:'#fdf2e9',stroke:'#e67e22'});
  y+=20+gap;

  return y;
}

// ============================================
// C.12 Alcance de Perfiles (cadena RBAC)
// ============================================
function drawAlcancePerfiles(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Verificación de Acceso (RBAC)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Usuario no-admin\naccede al dashboard');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'GET /api/users/email/\n:email/\nsensores-permitidos');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  const dy=y+18;
  decision(doc,cx+bw/2,dy,100,36,'¿Es\nadministrador?');
  label(doc,cx+bw/2+52,dy-5,'SÍ');
  arrowRight(doc,cx+bw/2+50,dy,cx+bw+30);
  box(doc,cx+bw+30,dy-12,80,24,'Acceso total\na todos los\nsensores',{fill:'#eafaf1',stroke:'#27ae60'});
  label(doc,cx+bw/2-15,dy+18,'NO');
  y=dy+36/2;arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  y=box(doc,cx,y,bw,24,'Paso 1: Obtener sectores\ndel usuario (user_sectors)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Paso 2: Obtener equipos\nde esos sectores\n(sector_equipos)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Paso 3: Obtener sensores\nde esos equipos\n(sensor_equipos)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Retornar lista filtrada:\nsectores, equipos,\nsensores permitidos');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Frontend filtra tabla\nmostrando solo sensores\npermitidos');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Dashboard filtrado por RBAC');
  return y+24;
}


// ============================================
// C.13 Flujo WebSocket (simplificado)
// ============================================
function drawFlujoWebSocket(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Sensor envía medición');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Servidor recibe dato\n(vía MQTT o HTTP)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Guarda en base de datos');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Evalúa umbrales\n(¿temperatura en rango?)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Servidor envía dato\na TODOS los navegadores\nconectados (broadcast)',{fill:'#eaf2f8',stroke:'#2980b9'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Branch: múltiples clientes
  const bx1=ox+15, bx2=cx, bx3=ox+W-95;
  lineRight(doc,cx+bw/2-50,y-2,bx1+40);
  lineRight(doc,cx+bw/2+50,y-2,bx3+40);

  box(doc,bx1,y,80,28,'Dashboard\nadministrador\n(tabla principal)');
  box(doc,bx2,y,80,28,'Dashboard\ncoordinador\n(vista filtrada)');
  box(doc,bx3,y,80,28,'Dashboard\noperador\n(solo lectura)');
  y+=28+gap;

  y=box(doc,cx,y,bw,24,'Cada navegador actualiza\nla tabla sin recargar\nla página');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  const dy=y+18;
  decision(doc,cx+bw/2,dy,110,36,'¿Temperatura\nfuera de rango?');
  label(doc,cx+bw/2+58,dy-5,'NO');
  arrowRight(doc,cx+bw/2+55,dy,cx+bw+40);
  box(doc,cx+bw+40,dy-12,80,24,'Celda se colorea\nverde (normal)');
  label(doc,cx+bw/2-15,dy+18,'SÍ');
  y=dy+36/2;arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  y=box(doc,cx,y,bw,bh,'Celda se colorea rojo\nSe muestra alerta\nen el dashboard',{fill:'#fdedec',stroke:'#c0392b'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Se envía correo\nal responsable');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Espera próxima medición');
  return y+24;
}


// ============================================
// WS.1 WebSocket Centralizado (principal)
// ============================================
function drawWsCentralizado(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'WS Centralizado (principal)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Navegador se conecta\nal servidor HTTP\n(raíz, sin path)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Servidor envía\nconfirmación de conexión');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Envía datos completos\ndesde caché o BD\n(sensores+mediciones\n+umbrales+sectores)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Cliente se suscribe\na canales:\nsensores, equipos,\nmediciones, etc.',{fill:'#eaf2f8',stroke:'#2980b9'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Push automático
  y=box(doc,cx,y,bw,bh,'DataManager detecta\ndatos nuevos →\nbroadcast automático\na TODOS los clientes',{fill:'#eafaf1',stroke:'#27ae60'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Funciones extra
  y=box(doc,cx,y,bw,38,'Funciones adicionales:\n• Supervisiones\n• Limpieza de caché\n• Métricas del servidor\n• Heartbeat cada 30s');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  y=box(doc,cx,y,bw,24,'Auto-actualización\ncada 30s (datos frescos)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Conexión persistente');
  return y+24;
}

// ============================================
// WS.2 WebSocket Datos Centrales (gráficos)
// ============================================
function drawWsDatosCentrales(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'WS Datos Centrales');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Dashboard gráfico\nse conecta a\npath: /datos-centrales');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Cliente solicita\ndatos históricos\nde un sensor');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Servidor consulta\nmediciones2 en MySQL\n(rango de fechas)');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Envía series temporales\nal cliente para\nrenderizar con Chart.js');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Gráfico se actualiza\nen tiempo real con\nnuevos puntos');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Visualización continua');
  return y+24;
}

// ============================================
// WS.3 WebSocket Enhanced (diagnóstico avanzado)
// ============================================
function drawWsEnhanced(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'WS Enhanced');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Cliente se conecta a\npath: /enhanced-ws');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Suscripciones reactivas:\ncambios en DataManager\ndisparan push automático');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,38,'Métricas en tiempo real:\n• Clientes conectados\n• Mensajes enviados\n• Cache hits/misses\n• Latencia promedio');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Diagnóstico avanzado:\nestado de conexiones,\nerrores, reconexiones');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Monitoreo del sistema');
  return y+24;
}

// ============================================
// WS.4 WebSocket Server Logs (consola)
// ============================================
function drawWsServerLogs(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'WS Server Logs');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Consola de diagnóstico\nse conecta a\npath: /ws/server-logs');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Servidor captura\nconsole.log/warn/error\ndel backend Node.js');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Cada log se envía\nen tiempo real al\ncliente conectado');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,bh,'Cliente renderiza\ncon colores por nivel:\ninfo/warning/error');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  y=box(doc,cx,y,bw,24,'Límite: últimas 50\nentradas visibles');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;
  endBox(doc,cx,y,bw,'Stream continuo de logs');
  return y+24;
}


// ============================================
// C.14 Flujo de Auditoría y Trazabilidad
// ============================================
function drawAuditoria(doc, ox, oy, W) {
  const bw=110,bh=30,gap=12,cx=ox+W/2-bw/2; let y=oy;
  y=startBox(doc,cx,y,bw,'Sistema de Auditoría\ny Trazabilidad');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // 5 fuentes de evidencia
  y=box(doc,cx-10,y,bw+20,20,'5 fuentes de evidencia para auditorías',{fill:'#eaf2f8',stroke:'#2980b9'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Fuente 1
  y=box(doc,cx,y,bw,38,'1. Registro de sesiones\n(historial_sesiones)\n• Usuario, fecha, hora\n• IP, dispositivo\n• Cada login queda\n  registrado');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Fuente 2
  y=box(doc,cx,y,bw,38,'2. Historial de config\n(sensor_config_history)\n• Valor anterior/nuevo\n• Quién lo cambió\n• Fecha y confirmación\n  del sensor');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Fuente 3
  y=box(doc,cx,y,bw,38,'3. Supervisiones\n(supervisiones)\n• Excursiones detectadas\n• Acción del operador\n• Observaciones\n• Estado: abierto/resuelto');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Fuente 4
  y=box(doc,cx,y,bw,38,'4. Calibración\n(certificados)\n• Sensor vs datalogger\n• Error calculado\n• Factor de corrección\n• Fecha y responsable');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Fuente 5
  y=box(doc,cx,y,bw,38,'5. Mediciones continuas\n(mediciones2)\n• 288 registros/día\n• Timestamp preciso\n• Temperatura + voltaje\n• 24/7 sin interrupciones');
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  // Resultado
  y=box(doc,cx,y,bw,bh,'Auditor accede a:\n• Historial completo\n• Reportes exportables\n• Evidencia trazable',{fill:'#eafaf1',stroke:'#27ae60'});
  arrowDown(doc,cx+bw/2,y,y+gap);y+=gap;

  endBox(doc,cx,y,bw,'Cumplimiento ANMAT\nISO 15189 / BPL');
  return y+24;
}
