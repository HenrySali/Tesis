/**
 * Valida que el HTML ensamblado tenga márgenes correctos antes de generar PDF
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const layoutCSS = fs.readFileSync(path.join(DIR, 'layout.css'), 'utf8');
const stylesCSS = fs.readFileSync(path.join(DIR, 'styles.css'), 'utf8');

console.log('=== VALIDACIÓN DE LAYOUT PARA PDF ===\n');

// 1. Verificar variables de márgenes en layout.css
console.log('1. MÁRGENES EN layout.css:');
const vars = ['--mt', '--mb', '--ml', '--mr', '--pw', '--fs', '--lh', '--text-indent'];
vars.forEach(v => {
  const m = layoutCSS.match(new RegExp(v + ':\\s*([^;]+)'));
  console.log(`   ${v}: ${m ? m[1].trim() : 'NO ENCONTRADO'}`);
});

// 2. Verificar que .page tiene padding con variables
console.log('\n2. REGLA .page (screen):');
const pageRule = layoutCSS.match(/\.page\s*\{([^}]+)\}/);
if (pageRule) {
  console.log('   ' + pageRule[1].trim());
  if (pageRule[1].includes('var(--mt)')) console.log('   ✅ Usa variables de márgenes');
  else console.log('   ❌ NO usa variables de márgenes');
  if (pageRule[1].includes('page-break-after')) console.log('   ✅ Tiene page-break-after');
  else console.log('   ❌ NO tiene page-break-after');
} else {
  console.log('   ❌ Regla .page no encontrada');
}

// 3. Verificar @media print
console.log('\n3. @media print:');
const printBlock = layoutCSS.match(/@media print\s*\{([\s\S]+)$/);
if (printBlock) {
  const content = printBlock[1];
  if (content.includes('@page')) console.log('   ✅ Tiene @page');
  if (content.includes('size: A4')) console.log('   ✅ Tamaño A4');
  if (content.includes('margin: 0')) console.log('   ✅ @page margin:0 (márgenes via padding)');
  
  const printPage = content.match(/\.page\s*\{([^}]+)\}/);
  if (printPage) {
    console.log('   .page print: ' + printPage[1].trim().substring(0, 200));
    if (printPage[1].includes('var(--mt)')) console.log('   ✅ Print .page usa variables');
    else console.log('   ❌ Print .page NO usa variables');
  }
} else {
  console.log('   ❌ @media print no encontrado');
}

// 4. Verificar que styles.css NO sobreescribe márgenes de .page
console.log('\n4. CONFLICTOS en styles.css:');
const stylesPageRule = stylesCSS.match(/\.page\s*\{([^}]+)\}/);
if (stylesPageRule) {
  const props = stylesPageRule[1];
  if (props.includes('padding')) console.log('   ⚠️  styles.css sobreescribe padding de .page');
  else console.log('   ✅ styles.css no toca padding de .page');
  if (props.includes('width')) console.log('   ⚠️  styles.css sobreescribe width de .page');
  else console.log('   ✅ styles.css no toca width de .page');
  console.log('   .page en styles.css: ' + props.trim());
} else {
  console.log('   ✅ styles.css no tiene regla .page');
}

// 5. Verificar secciones HTML
console.log('\n5. SECCIONES HTML:');
const sections = [
  'portada', 'resumen', 'toc', 'toc-figuras', 'toc-tablas',
  'capitulo-1', 'capitulo-2', 'capitulo-3', 'capitulo-4',
  'capitulo-5', 'capitulo-6', 'capitulo-7', 'referencias',
  'anexo-a', 'anexo-b', 'anexo-c', 'anexo-d', 'anexo-e',
  'anexo-f', 'anexo-g', 'anexo-h', 'anexo-i', 'anexo-k', 'anexo-l'
];
let ok = 0, fail = 0;
sections.forEach(s => {
  const file = path.join(DIR, s + '.html');
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('class="page"')) { ok++; }
    else { console.log(`   ❌ ${s}.html no tiene class="page"`); fail++; }
  } else {
    console.log(`   ❌ ${s}.html no existe`); fail++;
  }
});
console.log(`   ${ok} secciones OK, ${fail} con problemas`);

// 6. Problema clave: Puppeteer y page-break
console.log('\n6. ESTRATEGIA PDF:');
console.log('   El CSS usa padding en .page para márgenes (no margin de Puppeteer)');
console.log('   Puppeteer debe usar: margin:0, preferCSSPageSize:true');
console.log('   emulateMediaType("print") para activar @media print');
console.log('   @page { size:A4; margin:0 } deja que .page controle todo');

console.log('\n=== FIN VALIDACIÓN ===');
