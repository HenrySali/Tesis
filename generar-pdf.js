/**
 * Genera PDF con márgenes APA aplicados por Puppeteer (no por CSS)
 * Esto garantiza márgenes en CADA hoja, no solo al inicio de cada sección
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const DIR = __dirname;
const OUTPUT = path.join(DIR, 'tesis-smarttemp-v2.pdf');

const SECTIONS = [
  'portada', 'resumen', 'toc', 'toc-figuras', 'toc-tablas',
  'capitulo-1', 'capitulo-2', 'capitulo-3', 'capitulo-4',
  'capitulo-5', 'capitulo-6', 'capitulo-7', 'referencias',
  'anexo-a', 'anexo-b', 'anexo-c', 'anexo-d', 'anexo-e',
  'anexo-f', 'anexo-g', 'anexo-h', 'anexo-i', 'anexo-k', 'anexo-l'
];

function read(f) {
  const p = path.join(DIR, f);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const layoutCSS = read('layout.css');
const stylesCSS = read('styles.css');
const sectionsHTML = SECTIONS.map(id => read(`${id}.html`)).join('\n');

// Imágenes con rutas absolutas
const imgDir = path.join(DIR, 'Imagenes').replace(/\\/g, '/');
const htmlFixed = sectionsHTML.replace(/src="Imagenes\//g, `src="file:///${imgDir}/`);

// HTML con padding CERO en .page — Puppeteer pone los márgenes
const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
${layoutCSS}
${stylesCSS}

/* OVERRIDE: quitar padding de .page porque Puppeteer aplica márgenes */
.toolbar, .image-toolbar { display: none !important; }
html, body {
  background: #fff !important;
  margin: 0 !important;
  padding: 0 !important;
}
.doc {
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
}
.page {
  width: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  box-shadow: none !important;
  background: #fff !important;
  page-break-after: always !important;
}
.page:last-child { page-break-after: auto !important; }
h1, h2, h3 { page-break-after: avoid !important; }
table, .fig, img, pre { page-break-inside: avoid !important; }
p { orphans: 3 !important; widows: 3 !important; }
.figure-image {
  max-width: 100% !important;
  max-height: 180mm !important;
  border: none !important;
  box-shadow: none !important;
}
.cover { padding-top: 30mm !important; }
</style>
</head>
<body>
<div class="doc">
${htmlFixed}
</div>
</body>
</html>`;

const TEMP = path.join(DIR, '_temp-pdf.html');
fs.writeFileSync(TEMP, fullHTML, 'utf8');
console.log(`HTML: ${(Buffer.byteLength(fullHTML) / 1024).toFixed(0)} KB`);

(async () => {
  console.log('Abriendo navegador...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.goto('file:///' + TEMP.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0', timeout: 60000
  });

  // Esperar imágenes
  await page.evaluate(async () => {
    await Promise.all(Array.from(document.querySelectorAll('img')).map(img =>
      img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
    ));
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Generando PDF (márgenes Puppeteer: 25.4mm/30mm/20mm)...');
  await page.pdf({
    path: OUTPUT,
    format: 'A4',
    margin: {
      top: '25.4mm',
      bottom: '25.4mm',
      left: '30mm',
      right: '20mm'
    },
    printBackground: false,
    preferCSSPageSize: false
  });

  await browser.close();
  fs.unlinkSync(TEMP);

  const size = (fs.statSync(OUTPUT).size / 1024).toFixed(0);
  console.log(`\n✅ PDF: ${OUTPUT} (${size} KB)`);
  console.log('   Márgenes en CADA hoja: sup 25.4mm, inf 25.4mm, izq 30mm, der 20mm');
})();
