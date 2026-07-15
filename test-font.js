const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margin: 72 });
doc.pipe(fs.createWriteStream(path.join(__dirname, 'test-font.pdf')));

const testLine = '┌─────────┐  │  └─────────┘  ├──┤  ┬  ┴  ┼  ▼  ►  ◄';
const box = `┌─────────────────────┐
│     ESP8266          │
│   (NodeMCU/Wemos)   │
│                     │
│  GPIO14 (D5) ───────┼──── Data (DQ)
│                     │
└─────────────────────┘`;

// Test Consolas
doc.registerFont('Consolas', 'C:/Windows/Fonts/consola.ttf');
doc.font('Consolas').fontSize(8);
doc.text('=== CONSOLAS ===');
doc.text(testLine, { lineBreak: false });
doc.moveDown(0.5);
box.split('\n').forEach(l => { doc.text(l, { lineBreak: false }); });

doc.moveDown(2);

// Test Lucida Console
doc.registerFont('LucidaConsole', 'C:/Windows/Fonts/lucon.ttf');
doc.font('LucidaConsole').fontSize(8);
doc.text('=== LUCIDA CONSOLE ===');
doc.text(testLine, { lineBreak: false });
doc.moveDown(0.5);
box.split('\n').forEach(l => { doc.text(l, { lineBreak: false }); });

doc.end();
console.log('test-font.pdf generado');
