const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const html = fs.readFileSync(path.join(DIR, 'anexo-b.html'), 'utf8');

// Quitar wrappers
let clean = html;
clean = clean.replace(/<div[^>]*class="(?:page|cover|doc)[^"]*"[^>]*>/gi, '');
clean = clean.replace(/<section[^>]*>/gi, '');
clean = clean.replace(/<\/section>/gi, '');

// Buscar pre
const pres = [...clean.matchAll(/<pre([^>]*)>(?:<code[^>]*>)?([\s\S]*?)(?:<\/code>)?<\/pre>/gi)];
console.log(`Total <pre> encontrados: ${pres.length}`);
pres.forEach((m, i) => {
  const isDiagram = m[1].includes('diagram');
  const lines = m[2].split('\n').length;
  console.log(`  ${i}: isDiagram=${isDiagram}, lines=${lines}, attrs="${m[1].trim()}"`);
  console.log(`     First line: ${m[2].split('\n')[1]?.substring(0, 60) || '(empty)'}`);
});
