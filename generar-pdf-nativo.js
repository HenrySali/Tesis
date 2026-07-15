/**
 * PDF nativo — formato APA 7ma edición
 * Márgenes: 2.54cm (1") en los 4 lados
 * Times New Roman 12pt, interlineado 1.5
 * Numeración de páginas inferior derecha
 * TOC con líneas punteadas
 * Tablas con espaciado APA
 * Imágenes proporcionales centradas
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUTPUT = path.join(DIR, 'tesis-smarttemp-v22.pdf');

const M = 72; // 2.54cm
const PW = 595.28;
const PH = 841.89;
const CW = PW - M * 2;
const FS = 12;
const LG = FS * 0.5; // interlineado 1.5
const INDENT = 36;
const CONSOLAS = 'C:/Windows/Fonts/consola.ttf';

// ============================================
// HELPERS
// ============================================
function strip(h) {
  return h.replace(/<[^>]+>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(n))
    .replace(/&nbsp;/g,' ').replace(/\u2212/g, '-').replace(/\s+/g,' ').trim();
}
function stripNL(h) {
  return h.replace(/<[^>]+>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(n))
    .replace(/&nbsp;/g,' ').replace(/\u2212/g, '-');
}

// ============================================
// PARSER
// ============================================
function parseSection(html) {
  let c = html;
  c = c.replace(/<div[^>]*class="(?:page|cover|doc)[^"]*"[^>]*>/gi,'');
  c = c.replace(/<section[^>]*>/gi,'');
  c = c.replace(/<\/section>/gi,'');
  
  const diagrams = [];
  c = c.replace(/<pre[^>]*class="diagram"[^>]*>([\s\S]*?)<\/pre>/gi, (_, content) => {
    diagrams.push(content);
    return `<!--DG_${diagrams.length-1}-->`;
  });
  
  const a = [];
  for (const m of c.matchAll(/<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/gi))
    a.push({idx:m.index, type:m[1].toLowerCase(), text:strip(m[2])});
  for (const m of c.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)) {
    const t=strip(m[2]); if(t) {
      const ni=m[1].includes('ni')||m[1].includes('fc')||m[1].includes('figure-caption')||m[1].includes('tt');
      a.push({idx:m.index, type:'p', text:t, noIndent:ni});
    }
  }
  for (const m of c.matchAll(/<(ol|ul)>([\s\S]*?)<\/\1>/gi)) {
    const items=[...m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(l=>strip(l[1]));
    if(items.length) a.push({idx:m.index, type:m[1].toLowerCase(), items});
  }
  for (const m of c.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows=[...m[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(tr=>({
      cells:[...tr[1].matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map(x=>strip(x[1])),
      isHeader:tr[1].includes('<th')
    }));
    if(rows.length) a.push({idx:m.index, type:'table', rows});
  }
  for (const m of c.matchAll(/<pre([^>]*)>(?:<code[^>]*>)?([\s\S]*?)(?:<\/code>)?<\/pre>/gi)) {
    const t=stripNL(m[2]); if(t) a.push({idx:m.index, type:'pre', text:t, isDiagram:false});
  }
  for (const m of c.matchAll(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi))
    a.push({idx:m.index, type:'img', src:m[1]});
  for (const m of c.matchAll(/<div([^>]*class="e[^"]*"[^>]*)>([\s\S]*?)<\/div>/gi)) {
    const spans=[...m[2].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];
    if(spans.length>=2) {
      let lv=1; if(m[1].includes('l2'))lv=2; if(m[1].includes('l3'))lv=3;
      a.push({idx:m.index, type:'toc-entry', text:strip(spans[0][1]), page:strip(spans[1][1]), level:lv});
    }
  }
  for (const m of c.matchAll(/<!--DG_(\d+)-->/g))
    a.push({idx:m.index, type:'pre', text:diagrams[parseInt(m[1])], isDiagram:true});
  
  a.sort((x,y)=>x.idx-y.idx);
  return a;
}

// ============================================
// PDF DOCUMENT
// ============================================
const doc = new PDFDocument({
  size:'A4', margins:{top:M,bottom:M,left:M,right:M}, bufferPages:true,
  info:{Title:'Sistema IoT para Monitoreo de Cadena de Frío',Author:'Henry Salinas'}
});
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);
if(fs.existsSync(CONSOLAS)) doc.registerFont('Consolas',CONSOLAS);

function sp(){return PH-M-doc.y}
function need(n){if(sp()<n)doc.addPage()}


// ============================================
// RENDER FUNCTIONS
// ============================================
function rH1(t) {
  need(60);
  doc.moveDown(0.3);
  doc.font('Times-Bold').fontSize(14).text(t, M, doc.y, {align:'center', width:CW});
  doc.moveDown(1);
}
function rH2(t, sectionCtx) {
  // Asegurar que el título no quede solo al final de página
  need(110);
  doc.moveDown(0.8);
  if(sectionCtx && sectionCtx.startsWith('anexo')) {
    // Annex h2: Times-Bold 14pt with 1em top space
    doc.font('Times-Bold').fontSize(14).text(t, M, doc.y, {width:CW});
  } else {
    doc.font('Times-Bold').fontSize(FS).text(t, M, doc.y, {width:CW});
  }
  doc.moveDown(0.5);
}
function rH3(t, sectionCtx) {
  // Need enough space for title + at least some content below (200pt for diagrams/code/tables)
  need(200);
  doc.moveDown(0.5);
  if(sectionCtx && sectionCtx.startsWith('anexo')) {
    doc.moveDown(0.3);
    doc.font('Times-BoldItalic').fontSize(FS).text(t, M, doc.y, {width:CW});
  } else {
    doc.font('Times-BoldItalic').fontSize(FS).text(t, M, doc.y, {width:CW});
  }
  doc.moveDown(0.4);
}
function rH4(t) {
  need(150);
  doc.moveDown(0.3);
  doc.font('Times-Italic').fontSize(FS).text(t, M, doc.y, {width:CW});
  doc.moveDown(0.3);
}
function rP(t, ni) {
  if(!t) return;
  // Detect figure captions: "Figura 1", "Figura D.1", etc.
  if(/^Figura\s+\d/.test(t) || /^Figura\s+[A-Z]\.\d/.test(t)) {
    need(9+6+12);
    doc.moveDown(0.3); // ~6pt after image
    doc.font('Times-Italic').fontSize(9).fillColor('#666');
    doc.text(t, M, doc.y, {width:CW, align:'center', lineGap:2});
    doc.fillColor('#000');
    doc.x=M;
    doc.moveDown(0.6); // ~12pt before next element
    return;
  }
  need(FS+LG+8);
  doc.font('Times-Roman').fontSize(FS);
  const x=M+(ni?0:INDENT), w=CW-(ni?0:INDENT);
  doc.text(t, x, doc.y, {width:w, align:'justify', lineGap:LG});
  doc.x=M;
  doc.moveDown(0.4);
}
function rList(items, ordered) {
  doc.moveDown(0.2);
  items.forEach((item,i)=>{
    need(FS+LG+8);
    const bullet = ordered ? `${i+1}. ` : '• ';
    doc.font('Times-Roman').fontSize(FS);
    doc.text(bullet+item, M+36, doc.y, {width:CW-36, align:'justify', lineGap:LG});
    doc.x=M;
    doc.moveDown(0.2);
  });
  doc.moveDown(0.4);
}

// --- Format cell data: round decimals, convert units, style placeholders ---
function formatCellData(text) {
  if(!text) return text;
  // Don't modify headers, percentages, integers, or short text
  if(/^\d+$/.test(text.trim())) return text; // pure integer
  if(/^\d+(\.\d)?%$/.test(text.trim())) return text; // percentage with max 1 decimal
  // Round long decimals: "564.3947222222222 horas" → "564.4 horas"
  let result = text.replace(/(\d+)\.(\d{2,})/g, (match, intPart, decPart) => {
    const num = parseFloat(intPart + '.' + decPart);
    return num.toFixed(1);
  });
  // Style placeholders
  if(result.includes('[DATO NO DISPONIBLE]')) result = result.replace('[DATO NO DISPONIBLE]', 'N/D');
  if(result.includes('Datalogger pendiente')) result = result.replace('Datalogger pendiente', 'Pendiente');
  return result;
}

// --- TABLAS con espaciado APA, sin cortar entre páginas ---
function rTable(rows) {
  if(!rows.length) return;
  const colCount = Math.max(...rows.map(r=>r.cells.length));
  if(!colCount) return;
  const colW = CW/colCount;
  const cp=5, tfs=8.5;

  // Calcular alto total de la tabla
  const rowHeights = rows.map(row => {
    let maxH = tfs+cp*2+4;
    row.cells.forEach(cell=>{
      const formatted = formatCellData(cell);
      doc.font(row.isHeader?'Times-Bold':'Times-Roman').fontSize(tfs);
      const h = doc.heightOfString(formatted,{width:colW-cp*2})+cp*2+4;
      if(h>maxH) maxH=h;
    });
    return maxH;
  });
  const totalH = rowHeights.reduce((a,b)=>a+b,0) + 4;

  doc.moveDown(0.6);

  // Si la tabla cabe completa en el espacio restante, renderizar acá
  // Si no, saltar a nueva página
  if(totalH < PH - M*2 && totalH > sp()-10) {
    doc.addPage();
  }

  // Encontrar el header row para repetirlo si la tabla cruza páginas
  const headerIdx = rows.findIndex(r=>r.isHeader);
  
  function drawRow(row, rowH) {
    const y0=doc.y;
    if(row.isHeader) {
      // APA top line: 1.5pt
      doc.save().moveTo(M,y0).lineTo(M+CW,y0).lineWidth(1.5).stroke('#000').restore();
    }
    row.cells.forEach((cell,ci)=>{
      const formatted = formatCellData(cell);
      doc.font(row.isHeader?'Times-Bold':'Times-Roman').fontSize(tfs).fillColor('#000');
      doc.text(formatted, M+ci*colW+cp, y0+cp+2, {width:colW-cp*2, lineGap:2});
    });
    doc.y = y0+rowH;
    if(row.isHeader) {
      // APA line under header: 0.75pt
      doc.save().moveTo(M,doc.y).lineTo(M+CW,doc.y).lineWidth(0.75).stroke('#000').restore();
    }
  }

  rows.forEach((row, ri) => {
    const rowH = rowHeights[ri];
    
    // If this row doesn't fit, go to next page and repeat header
    if(sp() < rowH + 10) {
      // APA partial close line: 1.5pt (consistent, not #ccc)
      doc.save().moveTo(M,doc.y).lineTo(M+CW,doc.y).lineWidth(1.5).stroke('#000').restore();
      doc.addPage();
      // Repeat header if exists
      if(headerIdx >= 0 && !row.isHeader) {
        drawRow(rows[headerIdx], rowHeights[headerIdx]);
      }
    }
    
    drawRow(row, rowH);
  });

  // APA bottom line: 1.5pt
  doc.save().moveTo(M,doc.y).lineTo(M+CW,doc.y).lineWidth(1.5).stroke('#000').restore();
  doc.moveDown(1);
  doc.x=M;
}

// --- CÓDIGO ---
function rPreCode(text) {
  const fn = fs.existsSync(CONSOLAS)?'Consolas':'Courier';
  const tfs=7;
  const lines=text.split('\n');
  const display = lines.length>50 ? lines.slice(0,50).join('\n')+'\n// ...(truncado)' : text;
  doc.font(fn).fontSize(tfs);
  const h=doc.heightOfString(display,{width:CW-16});
  const boxH=h+16;
  if(boxH>sp()-10) doc.addPage();
  const y0=doc.y;
  doc.save().rect(M,y0,CW,Math.min(boxH,sp()-5)).fill('#f5f5f5').restore();
  doc.fillColor('#000').font(fn).fontSize(tfs);
  doc.text(display, M+8, y0+8, {width:CW-16, lineGap:1.5});
  doc.moveDown(0.8);
  doc.x=M;
}

// --- DIAGRAMAS ---
const diagramas = require('./diagramas.js');
function detectDiagram(text) {
  if(text.includes('Ciclo de Medición') || text.includes('INICIO_CICLO_MEDICION')) return 'drawB1';
  if(text.includes('Nueva medición recibida') || text.includes('NUEVA_MEDICION_RECIBIDA')) return 'drawB2';
  if(text.includes('Proceso de Calibración') || text.includes('PROCESO_CALIBRACION')) return 'drawB3';
  if(text.includes('pérdida de conexión WiFi') || text.includes('PERDIDA_CONEXION_WIFI')) return 'drawB4';
  if(text.includes('DIAGRAMA_CONFIG_PERIODOS')) return 'drawConfigPeriodos';
  if(text.includes('DIAGRAMA_CONFIG_UMBRALES')) return 'drawConfigUmbrales';
  if(text.includes('DIAGRAMA_SIMULADOR')) return 'drawSimulador';
  if(text.includes('DIAGRAMA_CONSOLA_SERVIDOR')) return 'drawConsolaServidor';
  if(text.includes('DIAGRAMA_VERIFICACION_RED')) return 'drawVerificacionRed';
  if(text.includes('DIAGRAMA_REG_SENSORES')) return 'drawRegistroSensores';
  if(text.includes('DIAGRAMA_REG_EQUIPOS')) return 'drawRegistroEquipos';
  if(text.includes('DIAGRAMA_REG_SECTORES')) return 'drawRegistroSectores';
  if(text.includes('DIAGRAMA_REG_USUARIOS')) return 'drawRegistroUsuarios';
  if(text.includes('DIAGRAMA_ASOC_SENSOR_EQUIPO')) return 'drawAsocSensorEquipo';
  if(text.includes('DIAGRAMA_ASOC_EQUIPO_SECTOR')) return 'drawAsocEquipoSector';
  if(text.includes('DIAGRAMA_ASOC_SECTOR_USUARIO')) return 'drawAsocSectorUsuario';
  if(text.includes('DIAGRAMA_ELIM_SENSOR')) return 'drawEliminacionSensor';
  if(text.includes('DIAGRAMA_ELIM_EQUIPO')) return 'drawEliminacionEquipo';
  if(text.includes('DIAGRAMA_ELIM_SECTOR')) return 'drawEliminacionSector';
  if(text.includes('DIAGRAMA_LOGIN_PERFILES')) return 'drawLoginPerfiles';
  if(text.includes('DIAGRAMA_ALCANCE_PERFILES')) return 'drawAlcancePerfiles';
  if(text.includes('DIAGRAMA_FLUJO_WEBSOCKET')) return 'drawFlujoWebSocket';
  if(text.includes('DIAGRAMA_WS_CENTRALIZADO')) return 'drawWsCentralizado';
  if(text.includes('DIAGRAMA_WS_DATOS_CENTRALES')) return 'drawWsDatosCentrales';
  if(text.includes('DIAGRAMA_WS_ENHANCED')) return 'drawWsEnhanced';
  if(text.includes('DIAGRAMA_WS_SERVER_LOGS')) return 'drawWsServerLogs';
  if(text.includes('DIAGRAMA_AUDITORIA')) return 'drawAuditoria';
  return null;
}
function rPre(text, isDiagram) {
  if(!text) return;
  if(isDiagram) {
    const fn = detectDiagram(text);
    if(fn && diagramas[fn]) {
      // Estimate diagram height: most diagrams need 500-700pt
      // Ensure enough space or move to next page
      const estimatedH = 550;
      if(sp() < estimatedH) doc.addPage();
      doc.moveDown(0.5);
      const yEnd = diagramas[fn](doc, M, doc.y, CW);
      doc.y = yEnd+10;
      doc.x=M;
      doc.font('Times-Roman').fontSize(FS).fillColor('#000');
      doc.moveDown(0.8);
      return;
    }
    need(20);
    doc.font('Times-Italic').fontSize(8).fillColor('#666');
    doc.text('[Diagrama: ver versión HTML]', M, doc.y, {width:CW, align:'center'});
    doc.fillColor('#000').font('Times-Roman').fontSize(FS);
    doc.moveDown(0.5); doc.x=M;
    return;
  }
  rPreCode(text);
}

// --- IMÁGENES proporcionales uniformes ---
function rImg(src) {
  let p=src;
  if(!path.isAbsolute(p)) p=path.join(DIR,p);
  if(!fs.existsSync(p)){rP('[Imagen: '+path.basename(p)+']',true);return}
  try {
    const img=doc.openImage(p);
    // Uniform width: 75% of content width
    const targetW = CW * 0.75;
    const maxH = 220;
    let w = targetW;
    let h = img.height * (targetW / img.width);
    // If height exceeds max, scale proportionally from maxH
    if(h > maxH) {
      h = maxH;
      w = img.width * (maxH / img.height);
    }
    need(h+30);
    // Uniform 15pt spacing before
    doc.y += 15;
    // Center horizontally
    doc.image(p, M+(CW-w)/2, doc.y, {width:w, height:h});
    doc.y += h;
    // Uniform 15pt spacing after
    doc.y += 15;
  } catch(e) {
    rP('[Error imagen: '+path.basename(p)+']',true);
  }
  doc.x=M;
}

// --- TOC con líneas punteadas ---
function rTocEntry(text, page, level) {
  need(FS+10);
  const indent = level===1?0 : level===2?24 : 48;
  const font = level===1?'Times-Bold':'Times-Roman';
  const fsize = level===1?12 : level===2?11 : 10;
  const pageW = 25;
  
  doc.font(font).fontSize(fsize);
  const textW = doc.widthOfString(text);
  const y = doc.y;
  
  // Texto
  doc.text(text, M+indent, y, {width:CW-indent-pageW-10, continued:false});
  const textEndX = M+indent+Math.min(textW, CW-indent-pageW-10);
  const textEndY = doc.y; // Y después del texto
  const lineY = y + fsize/2 + 1;
  
  // Línea punteada
  const dotStart = textEndX + 4;
  const dotEnd = M+CW-pageW-2;
  if(dotEnd > dotStart+10) {
    doc.save();
    doc.moveTo(dotStart, lineY).lineTo(dotEnd, lineY)
      .dash(1.5, {space:2}).lineWidth(0.4).stroke('#999');
    doc.undash();
    doc.restore();
  }
  
  // Número de página
  doc.font('Times-Roman').fontSize(fsize);
  doc.text(page, M+CW-pageW, y, {width:pageW, align:'right'});
  
  doc.y = Math.max(textEndY, y+fsize+4);
  doc.moveDown(0.15);
  doc.x=M;
}


// ============================================
// PORTADA
// ============================================
function renderPortada() {
  doc.moveDown(5);
  doc.font('Times-Bold').fontSize(14);
  doc.text('UNIVERSIDAD FAVALORO', M, doc.y, {align:'center', width:CW});
  doc.moveDown(0.3);
  doc.save().moveTo(M+80,doc.y).lineTo(M+CW-80,doc.y).lineWidth(1.5).stroke().restore();
  doc.moveDown(1.2);
  doc.font('Times-Roman').fontSize(11);
  doc.text('FACULTAD DE INGENIERÍA Y CIENCIAS EXACTAS Y NATURALES', M, doc.y, {align:'center', width:CW});
  doc.moveDown(2.5);
  doc.font('Times-Bold').fontSize(14);
  doc.text('TESIS DE MAESTRÍA EN INGENIERÍA BIOMÉDICA', M, doc.y, {align:'center', width:CW});
  doc.moveDown(0.3);
  doc.font('Times-Roman').fontSize(12);
  doc.text('Modalidad Profesional', M, doc.y, {align:'center', width:CW});
  doc.moveDown(2.5);
  doc.font('Times-Italic').fontSize(13);
  doc.text('Diseño e Implementación de un Sistema IoT para el Monitoreo Continuo de la Cadena de Frío en un Laboratorio de Biología Molecular', M, doc.y, {align:'center', width:CW, lineGap:5});
  doc.moveDown(3);
  doc.font('Times-Roman').fontSize(10);
  ['AUTOR DEL PROYECTO: Henry Salinas','Mail: ing.hensal@gmail.com | Tel: 1125111398','',
   'DIRECTOR DE TESIS: Marcelo Kauffman','Celular: 11 5181-2983'].forEach(l=>{
    if(!l){doc.moveDown(0.5);return}
    doc.text(l, M, doc.y, {align:'center', width:CW});
  });
  doc.moveDown(4);
  doc.font('Times-Bold').fontSize(11);
  doc.text('Buenos Aires, 2026', M, doc.y, {align:'center', width:CW});
}

// ============================================
// SECCIONES Y GENERACIÓN
// ============================================
const SECTIONS = [
  'portada','resumen','toc','toc-figuras','toc-tablas',
  'capitulo-1','capitulo-2','capitulo-3','capitulo-4',
  'capitulo-5','capitulo-6','capitulo-7','referencias',
  'anexo-a','anexo-b','anexo-c','anexo-d','anexo-e',
  'anexo-f','anexo-g','anexo-h','anexo-i','anexo-k','anexo-l'
];

// Secciones que REQUIEREN página nueva
const NEW_PAGE_SECTIONS = new Set([
  'portada','resumen','toc','toc-figuras','toc-tablas',
  'capitulo-1','capitulo-2','capitulo-3','capitulo-4',
  'capitulo-5','capitulo-6','capitulo-7','referencias',
  'anexo-a','anexo-b','anexo-c','anexo-d','anexo-e',
  'anexo-f','anexo-g','anexo-h','anexo-i','anexo-k','anexo-l'
]);

// Secciones del TOC que se saltan en la primera pasada (se generan al final)
const TOC_SECTIONS = new Set(['toc','toc-figuras','toc-tablas']);

// Páginas reservadas para TOC (se llenan después)
let tocPageStart = -1;
// Dynamic: main TOC ~36 entries fits in ~1.5 pages, figures/tables TOC in remaining
const TOC_RESERVED_PAGES = 1;

console.log('\nGenerando PDF...');
let first = true;
const sectionPageStart = {};
const subsectionPageMap = {}; // Maps subsection text → page number

SECTIONS.forEach(id => {
  const file = path.join(DIR, id+'.html');
  if(!fs.existsSync(file)) return;
  const html = fs.readFileSync(file,'utf8');

  // Reservar páginas para TOC pero no renderizar todavía
  if(TOC_SECTIONS.has(id)) {
    if(tocPageStart === -1) {
      if(!first) doc.addPage();
      first = false;
      tocPageStart = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      // Reservar páginas vacías para TOC
      for(let i=1; i<TOC_RESERVED_PAGES; i++) doc.addPage();
    }
    return;
  }

  if(!first && NEW_PAGE_SECTIONS.has(id)) {
    // Avoid spurious blank pages: only addPage if cursor is not already at page start
    if(doc.y > M + 5) {
      doc.addPage();
    }
  }
  first = false;
  
  sectionPageStart[id] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;

  if(id==='portada'){renderPortada();console.log('  ✅ portada');return}

  const els = parseSection(html);
  for(let ei=0; ei<els.length; ei++){
    const el = els[ei];
    const nextEl = els[ei+1];
    const nextNextEl = els[ei+2];
    
    // Look-ahead: if h3 is followed by p + diagram, or h3 + diagram,
    // check if the whole block fits. If not, jump to new page BEFORE the title.
    if(el.type === 'h3' && nextEl) {
      let diagramFollows = false;
      if(nextEl.type === 'pre' && nextEl.isDiagram) diagramFollows = true;
      if(nextEl.type === 'p' && nextNextEl && nextNextEl.type === 'pre' && nextNextEl.isDiagram) diagramFollows = true;
      if(diagramFollows && sp() < 600) {
        doc.addPage();
      }
    }
    // Same for h3 followed by pre (code block)
    if(el.type === 'h3' && nextEl && nextEl.type === 'pre' && !nextEl.isDiagram) {
      if(sp() < 300) doc.addPage();
    }
    // h3 followed by table
    if(el.type === 'h3' && nextEl && nextEl.type === 'table') {
      if(sp() < 250) doc.addPage();
    }
    // h3 followed by img
    if(el.type === 'h3' && nextEl && nextEl.type === 'img') {
      if(sp() < 280) doc.addPage();
    }
    
    switch(el.type){
      case 'h1': rH1(el.text); break;
      case 'h2':
        subsectionPageMap[el.text] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
        rH2(el.text, id);
        break;
      case 'h3':
        subsectionPageMap[el.text] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
        rH3(el.text, id);
        break;
      case 'h4': rH4(el.text); break;
      case 'p': rP(el.text, el.noIndent); break;
      case 'ol': rList(el.items, true); break;
      case 'ul': rList(el.items, false); break;
      case 'table': rTable(el.rows); break;
      case 'pre': rPre(el.text, el.isDiagram); break;
      case 'img': rImg(el.src); break;
      case 'toc-entry': rTocEntry(el.text, el.page, el.level); break;
    }
  }
  console.log(`  ✅ ${id} (${els.length} elementos)`);
});

// Registrar la última página con contenido real
const lastRealContentPage = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;

// ============================================
// GENERAR TOC CON NÚMEROS DE PÁGINA REALES
// ============================================
const firstNumberedPage = tocPageStart + TOC_RESERVED_PAGES; // primera página con número

// Definición del TOC
const tocEntries = [
  {text:'Capítulo 1: Introducción', id:'capitulo-1', level:1},
  {text:'1.1 Planteamiento del problema', level:2},
  {text:'1.2 Justificación', level:2},
  {text:'1.3 Objetivos', level:2},
  {text:'1.4 Alcance y limitaciones', level:2},
  {text:'1.5 Organización del documento', level:2},
  {text:'Capítulo 2: Marco Teórico', id:'capitulo-2', level:1},
  {text:'2.1 Cadena de frío en laboratorios', level:2},
  {text:'2.2 Internet de las Cosas (IoT) aplicado a salud', level:2},
  {text:'2.3 Protocolos de comunicación', level:2},
  {text:'2.4 Tecnologías de hardware', level:2},
  {text:'2.5 Tecnologías de software', level:2},
  {text:'2.6 Estado del arte', level:2},
  {text:'2.7 Metodologías de desarrollo de sistemas IoT', level:2},
  {text:'Capítulo 3: Marco Metodológico', id:'capitulo-3', level:1},
  {text:'3.1 Tipo de estudio', level:2},
  {text:'3.2 Población y muestra', level:2},
  {text:'3.3 Materiales', level:2},
  {text:'3.4 Metodología de desarrollo', level:2},
  {text:'3.5 Instrumentos de recolección de datos', level:2},
  {text:'3.6 Criterios de aceptación', level:2},
  {text:'Capítulo 4: Diseño e Implementación', id:'capitulo-4', level:1},
  {text:'4.1 Arquitectura general del sistema', level:2},
  {text:'4.2 Capa de percepción: Firmware ESP8266', level:2},
  {text:'4.3 Capa de procesamiento: Servidor Backend', level:2},
  {text:'4.4 Capa de aplicación: Frontend Web', level:2},
  {text:'Capítulo 5: Resultados', id:'capitulo-5', level:1},
  {text:'5.1 Sistema implementado', level:2},
  {text:'5.2 Métricas de desempeño técnico', level:2},
  {text:'5.3 Métricas de impacto en la cadena de frío', level:2},
  {text:'5.4 Comparación con soluciones comerciales', level:2},
  {text:'5.6 Validación de criterios de aceptación', level:2},
  {text:'Capítulo 6: Discusión', id:'capitulo-6', level:1},
  {text:'Capítulo 7: Conclusiones', id:'capitulo-7', level:1},
  {text:'Referencias Bibliográficas', id:'referencias', level:1},
  {text:'Anexos', level:1},
];

// Renderizar TOC en las páginas reservadas
if(tocPageStart >= 0) {
  doc.switchToPage(tocPageStart);
  doc.y = M;
  doc.font('Times-Bold').fontSize(14).text('Contenido', M, M, {align:'center', width:CW});
  doc.moveDown(1);
  
  tocEntries.forEach(e => {
    // Calcular número de página real
    let pageNum = '';
    if(e.id && sectionPageStart[e.id] !== undefined) {
      pageNum = String(sectionPageStart[e.id] - firstNumberedPage + 1);
    } else if(!e.id && subsectionPageMap[e.text] !== undefined) {
      // Subsection: look up from registered h2/h3 positions
      pageNum = String(subsectionPageMap[e.text] - firstNumberedPage + 1);
    }
    
    const indent = e.level===1?0 : e.level===2?24 : 48;
    const font = e.level===1?'Times-Bold':'Times-Roman';
    const fsize = e.level===1?11 : 10;
    const pageW = 25;
    
    doc.font(font).fontSize(fsize);
    const y = doc.y;
    const textW = doc.widthOfString(e.text);
    
    doc.text(e.text, M+indent, y, {width:CW-indent-pageW-10});
    const textEndX = M+indent+Math.min(textW, CW-indent-pageW-10);
    const lineY = y + fsize/2 + 1;
    
    // Línea punteada
    const dotStart = textEndX + 4;
    const dotEnd = M+CW-pageW-2;
    if(dotEnd > dotStart+10 && pageNum) {
      doc.save();
      doc.moveTo(dotStart, lineY).lineTo(dotEnd, lineY)
        .dash(1.5, {space:2}).lineWidth(0.4).stroke('#999');
      doc.undash();
      doc.restore();
    }
    
    if(pageNum) {
      doc.font('Times-Roman').fontSize(fsize);
      doc.text(pageNum, M+CW-pageW, y, {width:pageW, align:'right'});
    }
    
    doc.y = Math.max(doc.y, y+fsize+4);
    doc.moveDown(0.1);
    
    // Si se acaba la página del TOC, pasar a la siguiente reservada
    if(doc.y > PH - M - 30) {
      const nextPage = tocPageStart + 1;
      if(nextPage < tocPageStart + TOC_RESERVED_PAGES) {
        doc.switchToPage(nextPage);
        doc.y = M;
      }
    }
  });
  
  console.log('  ✅ TOC con números de página reales');
}

// ============================================
// NUMERACIÓN DE PÁGINAS (APA: inferior derecha)
// Solo numerar páginas con contenido real (no las vacías del TOC ni las del final)
// ============================================
const range = doc.bufferedPageRange();

// Calcular la última página con contenido real
const lastUsedPage = lastRealContentPage;

for(let i=0; i<range.count; i++) {
  doc.switchToPage(range.start + i);
  
  // Solo numerar desde primer capítulo hasta última página con contenido
  if(i >= firstNumberedPage && i <= lastUsedPage) {
    const pageNum = i - firstNumberedPage + 1;
    doc.save();
    doc.font('Times-Roman').fontSize(10).fillColor('#000');
    doc.text(String(pageNum), PW - M - 30, PH - M + 15, {width:30, align:'right'});
    doc.restore();
  }
}

doc.end();
stream.on('finish', ()=>{
  const sz = (fs.statSync(OUTPUT).size/1024).toFixed(0);
  console.log(`\n✅ PDF: ${OUTPUT} (${sz} KB)`);
  console.log('   Márgenes APA: 2.54cm en los 4 lados');
  console.log('   Numeración: inferior derecha desde Cap. 1');
  console.log('   TOC: con líneas punteadas');
});
