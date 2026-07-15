"""
Genera Word (.docx) a partir de los HTML de la tesis usando html-for-docx.
Preserva formato de tablas, código, listas y estilos correctamente.

Ejecutar: python generar-word-v2.py
"""

import os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from html_for_docx import HtmlToDocx

ARCHIVOS = [
    'portada.html',
    'resumen.html',
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
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(BASE_DIR, 'tesis-smarttemp-v27-APA.docx')


def generar_word():
    print("Generando Word con html-for-docx...")
    
    doc = Document()
    
    # Márgenes APA 7: 2.54 cm
    for section in doc.sections:
        section.top_margin = Cm(2.54)
        section.bottom_margin = Cm(2.54)
        section.left_margin = Cm(2.54)
        section.right_margin = Cm(2.54)
    
    # Configurar estilo Normal
    style = doc.styles['Normal']
    style.font.name = 'Times New Roman'
    style.font.size = Pt(12)
    style.paragraph_format.line_spacing = 1.5  # 1.5 (más práctico que doble)
    
    # Crear el conversor
    parser = HtmlToDocx()
    parser.table_style = 'Table Grid'
    
    archivos_procesados = 0
    
    for archivo in ARCHIVOS:
        filepath = os.path.join(BASE_DIR, archivo)
        if not os.path.exists(filepath):
            print(f"  ⚠️  No encontrado: {archivo}")
            continue
        
        print(f"  Procesando: {archivo}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Salto de página entre secciones
        if archivos_procesados > 0:
            doc.add_page_break()
        
        # Convertir HTML a docx
        parser.add_html_to_document(html_content, doc)
        archivos_procesados += 1
    
    # Guardar
    doc.save(OUTPUT)
    print(f"\n✅ Documento generado: {OUTPUT}")
    print(f"   Archivos procesados: {archivos_procesados}/{len(ARCHIVOS)}")


if __name__ == '__main__':
    generar_word()
