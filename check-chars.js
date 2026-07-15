const fs = require('fs');
const h = fs.readFileSync('Tabla de contenido/Avances comparativos tesis/tesis/Tesis documentoKiro/anexo-b.html', 'utf8');
const pres = [...h.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)];
console.log(`Found ${pres.length} <pre> blocks`);
const chars = new Set();
pres.forEach(m => {
  for (const c of m[1]) {
    if (c.charCodeAt(0) > 127) chars.add('U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0') + ' ' + c);
  }
});
console.log('Unicode chars used in diagrams:');
Array.from(chars).sort().forEach(c => console.log('  ' + c));
// Show first 5 lines of first diagram
console.log('\nFirst 5 lines of first diagram:');
const lines = pres[0][1].split('\n').slice(0, 5);
lines.forEach(l => console.log(JSON.stringify(l)));
