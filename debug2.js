const fs = require('fs');
const path = require('path');

function strip(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

const html = fs.readFileSync(path.join(__dirname, 'anexo-b.html'), 'utf8');
let clean = html;
clean = clean.replace(/<div[^>]*class="(?:page|cover|doc)[^"]*"[^>]*>/gi, '');
clean = clean.replace(/<section[^>]*>/gi, '');
clean = clean.replace(/<\/section>/gi, '');

// Check: are there <p> tags that contain box-drawing chars?
const ps = [...clean.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)];
ps.forEach((m, i) => {
  const text = strip(m[2]);
  if (text.includes('┌') || text.includes('│') || text.includes('└') || text.includes('▼') || text.includes('%')) {
    console.log(`P[${i}] CONTAINS BOX CHARS: "${text.substring(0, 80)}..."`);
  }
});

// Check pre detection
const pres = [...clean.matchAll(/<pre([^>]*)>(?:<code[^>]*>)?([\s\S]*?)(?:<\/code>)?<\/pre>/gi)];
console.log(`\nTotal <pre> found: ${pres.length}`);
pres.forEach((m, i) => {
  console.log(`PRE[${i}] isDiagram=${m[1].includes('diagram')} first40="${m[2].substring(0,40).replace(/\n/g,'\\n')}"`);
});

// The real question: is the pre content ALSO being matched as paragraphs?
// Check if any <p> overlaps with <pre> content
console.log('\nChecking for text between </p> and <pre>:');
const between = clean.match(/<\/p>\s*<pre/g);
console.log(`Found ${between ? between.length : 0} </p> immediately before <pre>`);

// Check if there's text NOT in any tag
const noTags = clean.replace(/<[^>]+>/g, '|||TAG|||');
const parts = noTags.split('|||TAG|||').filter(p => p.trim() && p.includes('┌'));
console.log(`\nOrphan text with box chars: ${parts.length}`);
parts.forEach((p, i) => console.log(`  [${i}] "${p.substring(0,60)}..."`));
