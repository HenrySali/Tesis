const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const docx = require('docx');

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ImageRun, PageBreak, AlignmentType, convertInchesToTwip,
  LevelFormat, NumberFormat, IndentLevel, TabStopPosition, TabStopType,
  TableLayoutType, VerticalAlign, ShadingType, ExternalHyperlink
} = docx;

// ============================================================
// Configuration
// ============================================================
const BASE_DIR = __dirname;
const OUTPUT_FILE = path.join(BASE_DIR, 'tesis-smarttemp-final.docx');

const HTML_FILES = [
  'portada.html',
  'resumen.html',
  'toc.html',
  'toc-figuras.html',
  'toc-tablas.html',
  'capitulo-1.html',
  'capitulo-2.html',
  'capitulo-3.html',
  'capitulo-4.html',
  'capitulo-5.html',
  'capitulo-6.html',
  'capitulo-7.html',
  'referencias.html',
  'anexo-a.html',
  'anexo-b.html',
  'anexo-c.html',
  'anexo-d.html',
  'anexo-e.html',
  'anexo-f.html',
  'anexo-g.html',
  'anexo-h.html',
  'anexo-i.html',
  'anexo-k.html',
  'anexo-l.html',
];

// Font configuration
const FONT_BODY = 'Times New Roman';
const FONT_SIZE = 24; // half-points (12pt = 24 half-points)
const FONT_SIZE_SMALL = 20; // 10pt
const LINE_SPACING = 360; // 1.5 line spacing (240 * 1.5)

// ============================================================
// Image loading helper
// ============================================================
function tryLoadImage(src) {
  try {
    const imgPath = path.join(BASE_DIR, decodeURIComponent(src));
    if (fs.existsSync(imgPath)) {
      const data = fs.readFileSync(imgPath);
      return data;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getImageDimensions(buffer) {
  // Basic dimension reading for PNG and JPEG
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    // PNG
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    // JPEG - scan for SOF marker
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] === 0xFF) {
        const marker = buffer[offset + 1];
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const len = buffer.readUInt16BE(offset + 2);
        offset += 2 + len;
      } else {
        offset++;
      }
    }
    return { width: 600, height: 400 };
  }
  return { width: 600, height: 400 };
}

// ============================================================
// HTML to DOCX conversion functions
// ============================================================

function getTextRuns(node, inheritBold = false, inheritItalic = false) {
  const runs = [];
  if (!node) return runs;

  if (node.nodeType === 3) {
    // Text node
    const text = node.rawText;
    if (text) {
      runs.push(new TextRun({
        text: text,
        font: FONT_BODY,
        size: FONT_SIZE,
        bold: inheritBold,
        italics: inheritItalic,
      }));
    }
    return runs;
  }

  if (node.nodeType === 1) {
    const tag = node.tagName ? node.tagName.toLowerCase() : '';
    let bold = inheritBold;
    let italic = inheritItalic;
    let isCode = false;
    let isSup = false;
    let isSub = false;

    if (tag === 'strong' || tag === 'b') bold = true;
    if (tag === 'em' || tag === 'i') italic = true;
    if (tag === 'code') isCode = true;
    if (tag === 'sup') isSup = true;
    if (tag === 'sub') isSub = true;
    if (tag === 'br') {
      runs.push(new TextRun({ text: '', break: 1, font: FONT_BODY, size: FONT_SIZE }));
      return runs;
    }
    if (tag === 'a') {
      // Just render the text content
      for (const child of node.childNodes) {
        runs.push(...getTextRuns(child, bold, italic));
      }
      return runs;
    }

    if (isCode) {
      const text = node.text || '';
      runs.push(new TextRun({
        text: text,
        font: 'Courier New',
        size: FONT_SIZE_SMALL,
        bold: bold,
        italics: italic,
      }));
      return runs;
    }

    if (isSup) {
      const text = node.text || '';
      runs.push(new TextRun({
        text: text,
        font: FONT_BODY,
        size: FONT_SIZE,
        bold: bold,
        italics: italic,
        superScript: true,
      }));
      return runs;
    }

    if (isSub) {
      const text = node.text || '';
      runs.push(new TextRun({
        text: text,
        font: FONT_BODY,
        size: FONT_SIZE,
        bold: bold,
        italics: italic,
        subScript: true,
      }));
      return runs;
    }

    for (const child of node.childNodes) {
      runs.push(...getTextRuns(child, bold, italic));
    }
  }

  return runs;
}

function parseTableNode(tableNode) {
  const rows = [];
  const allTr = tableNode.querySelectorAll('tr');

  for (const tr of allTr) {
    const cells = [];
    const tds = tr.querySelectorAll('th, td');
    const isHeader = tr.parentNode && tr.parentNode.tagName &&
      tr.parentNode.tagName.toLowerCase() === 'thead';

    for (const td of tds) {
      const textRuns = getTextRuns(td, isHeader || td.tagName.toLowerCase() === 'th');
      cells.push({
        runs: textRuns.length > 0 ? textRuns : [new TextRun({ text: '', font: FONT_BODY, size: FONT_SIZE })],
        isHeader: isHeader || td.tagName.toLowerCase() === 'th',
      });
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

function createDocxTable(tableData) {
  if (tableData.length === 0) return null;

  const maxCols = Math.max(...tableData.map(r => r.length));

  const tableRows = tableData.map(rowData => {
    const cells = [];
    for (let i = 0; i < maxCols; i++) {
      const cellData = rowData[i] || { runs: [new TextRun({ text: '', font: FONT_BODY, size: FONT_SIZE })], isHeader: false };
      cells.push(new TableCell({
        children: [new Paragraph({
          children: cellData.runs,
          spacing: { before: 40, after: 40 },
          alignment: AlignmentType.LEFT,
        })],
        shading: cellData.isHeader ? { type: ShadingType.SOLID, color: 'E8E8E8' } : undefined,
        verticalAlign: VerticalAlign.CENTER,
      }));
    }
    return new TableRow({ children: cells });
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function processListItems(listNode, ordered = false) {
  const items = [];
  const lis = listNode.querySelectorAll(':scope > li');
  let counter = 0;

  for (const li of lis) {
    counter++;
    const prefix = ordered ? `${counter}. ` : '\u2022 ';

    // Get direct text content (not nested lists)
    const childElements = [];
    let hasNestedList = false;

    for (const child of li.childNodes) {
      if (child.nodeType === 1 && (child.tagName.toLowerCase() === 'ul' || child.tagName.toLowerCase() === 'ol')) {
        hasNestedList = true;
        // Process nested list items with indent
        const nestedOrdered = child.tagName.toLowerCase() === 'ol';
        const nestedItems = processListItems(child, nestedOrdered);
        for (const ni of nestedItems) {
          items.push({
            ...ni,
            indent: (ni.indent || 0) + 1,
          });
        }
      } else {
        childElements.push(child);
      }
    }

    // Build runs for the list item text
    const runs = [new TextRun({ text: prefix, font: FONT_BODY, size: FONT_SIZE })];
    for (const child of childElements) {
      runs.push(...getTextRuns(child));
    }

    items.push({
      runs: runs,
      indent: 0,
    });
  }

  return items;
}

// ============================================================
// Main processing function for a single HTML file
// ============================================================
function processHtmlFile(filename, isFirst = false) {
  const elements = [];
  const filePath = path.join(BASE_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File not found: ${filename}`);
    return elements;
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const root = parse(html);

  // Add page break before each section (except first)
  if (!isFirst) {
    elements.push(new Paragraph({
      children: [new PageBreak()],
    }));
  }

  // Special handling for portada.html
  if (filename === 'portada.html') {
    return processPortada(root, elements);
  }

  // Process the content within the page div
  const pageDiv = root.querySelector('.page') || root;
  processChildren(pageDiv, elements);

  return elements;
}

function processPortada(root, elements) {
  // Build cover page manually
  const spacing = { before: 0, after: 200 };

  // University logo placeholder - add spacing at top
  elements.push(new Paragraph({ spacing: { before: 600, after: 400 }, children: [] }));

  elements.push(new Paragraph({
    children: [new TextRun({ text: 'UNIVERSIDAD FAVALORO', font: FONT_BODY, size: 32, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({ text: '_______________________________________________', font: FONT_BODY, size: FONT_SIZE })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({ text: 'FACULTAD DE INGENIERIA Y CIENCIAS EXACTAS Y NATURALES', font: FONT_BODY, size: 28, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({ text: 'TESIS DE MAESTRIA EN INGENIERIA BIOMEDICA', font: FONT_BODY, size: 28, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({ text: 'Modalidad Profesional', font: FONT_BODY, size: FONT_SIZE, italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({
      text: 'Diseno e Implementacion de un Sistema IoT para el Monitoreo Continuo de la Cadena de Frio en un Laboratorio de Biologia Molecular',
      font: FONT_BODY, size: 28, bold: true
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 800 },
  }));

  // Author info
  const authorInfo = [
    { label: 'AUTOR DEL PROYECTO: ', value: 'Henry Salinas' },
    { label: 'DATOS DE CONTACTO DEL AUTOR:', value: '' },
    { label: 'Mail: ', value: 'ing.hensal@gmail.com' },
    { label: 'Tel: ', value: '1125111398' },
    { label: '', value: '' },
    { label: 'DIRECTOR DE TESIS: ', value: 'Marcelo Kauffman' },
    { label: 'DATOS DE CONTACTO DEL DIRECTOR:', value: '' },
    { label: 'Celular: ', value: '11 5181-2983' },
    { label: 'Mail:', value: '' },
  ];

  for (const info of authorInfo) {
    if (info.label === '' && info.value === '') {
      elements.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
      continue;
    }
    const runs = [];
    if (info.label) {
      runs.push(new TextRun({ text: info.label, font: FONT_BODY, size: FONT_SIZE, bold: true }));
    }
    if (info.value) {
      runs.push(new TextRun({ text: info.value, font: FONT_BODY, size: FONT_SIZE }));
    }
    elements.push(new Paragraph({
      children: runs,
      spacing: { after: 80 },
    }));
  }

  elements.push(new Paragraph({ spacing: { after: 400 }, children: [] }));

  elements.push(new Paragraph({
    children: [
      new TextRun({ text: 'FECHA: ', font: FONT_BODY, size: FONT_SIZE, bold: true }),
      new TextRun({ text: 'Buenos Aires, 2026', font: FONT_BODY, size: FONT_SIZE }),
    ],
    spacing: { after: 800 },
  }));

  // Signature lines
  elements.push(new Paragraph({ spacing: { after: 600 }, children: [] }));

  elements.push(new Paragraph({
    children: [
      new TextRun({ text: '____________________________          ____________________________', font: FONT_BODY, size: FONT_SIZE }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }));

  elements.push(new Paragraph({
    children: [
      new TextRun({ text: 'Nombre, apellido y firma del                     Firma del Estudiante', font: FONT_BODY, size: FONT_SIZE_SMALL }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));

  elements.push(new Paragraph({
    children: [
      new TextRun({ text: 'Director del Proyecto', font: FONT_BODY, size: FONT_SIZE_SMALL }),
    ],
    alignment: AlignmentType.CENTER,
  }));

  return elements;
}

function processChildren(parentNode, elements) {
  for (const child of parentNode.childNodes) {
    if (child.nodeType === 3) {
      // Text node - only add if it has meaningful content
      const text = child.rawText.trim();
      if (text) {
        elements.push(new Paragraph({
          children: [new TextRun({ text: text, font: FONT_BODY, size: FONT_SIZE })],
          spacing: { after: 120, line: LINE_SPACING },
        }));
      }
      continue;
    }

    if (child.nodeType !== 1) continue;

    const tag = child.tagName.toLowerCase();

    switch (tag) {
      case 'h1':
        elements.push(new Paragraph({
          children: getTextRuns(child, true),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 240, line: LINE_SPACING },
        }));
        break;

      case 'h2':
        elements.push(new Paragraph({
          children: getTextRuns(child, true),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 200, line: LINE_SPACING },
        }));
        break;

      case 'h3':
        elements.push(new Paragraph({
          children: getTextRuns(child, true),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 160, line: LINE_SPACING },
        }));
        break;

      case 'h4':
        elements.push(new Paragraph({
          children: getTextRuns(child, true),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 200, after: 120, line: LINE_SPACING },
        }));
        break;

      case 'p': {
        const className = child.getAttribute('class') || '';
        const runs = getTextRuns(child);
        if (runs.length > 0) {
          elements.push(new Paragraph({
            children: runs,
            spacing: { after: 200, line: LINE_SPACING },
            alignment: className.includes('figure-caption') ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
          }));
        }
        break;
      }

      case 'ul':
      case 'ol': {
        const ordered = tag === 'ol';
        const listItems = processListItems(child, ordered);
        for (const item of listItems) {
          const indentMm = 10 + (item.indent || 0) * 7;
          elements.push(new Paragraph({
            children: item.runs,
            spacing: { after: 120, line: LINE_SPACING },
            indent: { left: convertInchesToTwip(indentMm / 25.4) },
          }));
        }
        break;
      }

      case 'table': {
        const tableData = parseTableNode(child);
        const table = createDocxTable(tableData);
        if (table) {
          elements.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }));
          elements.push(table);
          elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
        }
        break;
      }

      case 'img': {
        const src = child.getAttribute('src');
        if (src) {
          const imgBuffer = tryLoadImage(src);
          if (imgBuffer) {
            try {
              const dims = getImageDimensions(imgBuffer);
              // Scale to max 6 inches wide, maintain aspect ratio
              const maxWidth = 6 * 72; // 6 inches in points
              const maxHeight = 8 * 72; // 8 inches in points
              let w = dims.width;
              let h = dims.height;

              if (w > maxWidth) {
                h = (h * maxWidth) / w;
                w = maxWidth;
              }
              if (h > maxHeight) {
                w = (w * maxHeight) / h;
                h = maxHeight;
              }

              elements.push(new Paragraph({
                children: [
                  new ImageRun({
                    data: imgBuffer,
                    transformation: {
                      width: Math.round(w),
                      height: Math.round(h),
                    },
                    type: src.toLowerCase().endsWith('.png') ? 'png' : 'jpg',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 100 },
              }));
            } catch (e) {
              console.warn(`Warning: Could not embed image ${src}: ${e.message}`);
              elements.push(new Paragraph({
                children: [new TextRun({ text: `[Imagen: ${src}]`, font: FONT_BODY, size: FONT_SIZE, italics: true })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 100 },
              }));
            }
          } else {
            elements.push(new Paragraph({
              children: [new TextRun({ text: `[Imagen no encontrada: ${src}]`, font: FONT_BODY, size: FONT_SIZE, italics: true })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 100 },
            }));
          }
        }
        break;
      }

      case 'pre': {
        // Code block
        const codeText = child.text || '';
        const lines = codeText.split('\n');
        for (const line of lines) {
          elements.push(new Paragraph({
            children: [new TextRun({
              text: line,
              font: 'Courier New',
              size: 16, // 8pt for code blocks
            })],
            spacing: { after: 0, line: 240 },
            indent: { left: convertInchesToTwip(0.3) },
          }));
        }
        elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
        break;
      }

      case 'div': {
        const className = child.getAttribute('class') || '';
        if (className.includes('toc')) {
          // Table of contents - process each entry
          const entries = child.querySelectorAll('.e');
          for (const entry of entries) {
            const spans = entry.querySelectorAll('span');
            let text = '';
            let page = '';
            if (spans.length >= 1) text = spans[0].text.trim();
            if (spans.length >= 2) page = spans[1].text.trim();

            const level = className.includes('l1') || entry.getAttribute('class').includes('l1') ? 0 :
              entry.getAttribute('class').includes('l3') ? 2 : 1;

            const indent = level * 7;
            const runs = [new TextRun({ text: text, font: FONT_BODY, size: FONT_SIZE })];
            if (page) {
              runs.push(new TextRun({ text: `  ${page}`, font: FONT_BODY, size: FONT_SIZE }));
            }

            elements.push(new Paragraph({
              children: runs,
              spacing: { after: 60, line: 276 },
              indent: { left: convertInchesToTwip(indent / 25.4) },
            }));
          }
        } else if (className.includes('cover')) {
          // Already handled in processPortada
        } else {
          // Generic div - process children
          processChildren(child, elements);
        }
        break;
      }

      case 'section':
        processChildren(child, elements);
        break;

      case 'blockquote': {
        const runs = getTextRuns(child);
        if (runs.length > 0) {
          elements.push(new Paragraph({
            children: runs,
            spacing: { after: 200, line: LINE_SPACING },
            indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
          }));
        }
        break;
      }

      case 'hr':
        elements.push(new Paragraph({
          children: [new TextRun({ text: '________________________________________', font: FONT_BODY, size: FONT_SIZE })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        }));
        break;

      default:
        // For other elements, try to extract text
        if (child.childNodes && child.childNodes.length > 0) {
          processChildren(child, elements);
        }
        break;
    }
  }
}

// ============================================================
// Main execution
// ============================================================
async function main() {
  console.log('Starting HTML to DOCX conversion...');
  console.log(`Processing ${HTML_FILES.length} files...`);

  const allElements = [];

  for (let i = 0; i < HTML_FILES.length; i++) {
    const filename = HTML_FILES[i];
    console.log(`  [${i + 1}/${HTML_FILES.length}] Processing: ${filename}`);
    const elements = processHtmlFile(filename, i === 0);
    allElements.push(...elements);
  }

  console.log(`Total elements generated: ${allElements.length}`);
  console.log('Creating document...');

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_BODY,
            size: FONT_SIZE,
          },
          paragraph: {
            spacing: { line: LINE_SPACING },
          },
        },
        heading1: {
          run: {
            font: FONT_BODY,
            size: 32, // 16pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 360, after: 240, line: LINE_SPACING },
          },
        },
        heading2: {
          run: {
            font: FONT_BODY,
            size: 28, // 14pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 280, after: 200, line: LINE_SPACING },
          },
        },
        heading3: {
          run: {
            font: FONT_BODY,
            size: 26, // 13pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 240, after: 160, line: LINE_SPACING },
          },
        },
        heading4: {
          run: {
            font: FONT_BODY,
            size: 24, // 12pt
            bold: true,
            italics: true,
          },
          paragraph: {
            spacing: { before: 200, after: 120, line: LINE_SPACING },
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1), // ~2.5cm
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      children: allElements,
    }],
  });

  console.log('Generating .docx file...');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_FILE, buffer);

  const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`\nDone! File saved: ${OUTPUT_FILE}`);
  console.log(`File size: ${fileSizeMB} MB`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
