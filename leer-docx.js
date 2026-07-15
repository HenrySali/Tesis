const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function main() {
  const file = path.join(__dirname, 'tesis-smarttemp-v19.docx');
  if (!fs.existsSync(file)) { console.log('No existe:', file); return; }
  
  const data = fs.readFileSync(file);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  
  // Extraer texto limpio
  const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Buscar headings y estructura
  console.log('=== ESTRUCTURA DEL DOCX ===');
  console.log('Total caracteres:', text.length);
  console.log('');
  
  // Buscar capítulos y secciones
  const patterns = [
    /\d+\.\s+[A-ZÁÉÍÓÚ][^\n.]{5,50}/g,  // "1. Introducción"
    /Capítulo\s+\d/g,
    /Anexo\s+[A-Z]/g,
    /Referencias/g
  ];
  
  // Mostrar primeros 2000 chars
  console.log('--- PRIMEROS 2000 CHARS ---');
  console.log(text.substring(0, 2000));
  console.log('');
  
  // Buscar secciones
  console.log('--- SECCIONES ENCONTRADAS ---');
  const sections = text.match(/\d+\.\d*\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{3,40}/g);
  if (sections) sections.forEach(s => console.log('  ' + s.trim()));
  
  // Buscar anexos
  const anexos = text.match(/Anexo\s+[A-Z][:\s][^\n]{5,50}/g);
  if (anexos) anexos.forEach(a => console.log('  ' + a.trim()));
}

main().catch(e => console.error(e.message));
