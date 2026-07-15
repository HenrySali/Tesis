"""
Genera Word (.docx) usando Pandoc - preserva formato HTML completo.
"""
import os
import pypandoc

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ARCHIVOS = [
    'portada.html', 'resumen.html',
    'capitulo-1.html', 'capitulo-2.html', 'capitulo-3.html',
    'capitulo-4.html', 'capitulo-5.html', 'capitulo-6.html',
    'capitulo-7.html', 'referencias.html',
    'anexo-a.html', 'anexo-b.html', 'anexo-c.html',
    'anexo-d.html', 'anexo-e.html', 'anexo-f.html',
    'anexo-g.html', 'anexo-h.html', 'anexo-i.html',
    'anexo-k.html', 'anexo-l.html',
]

OUTPUT = os.path.join(BASE_DIR, 'tesis-smarttemp-v27-pandoc.docx')

# Concatenar todos los HTML en uno solo
print("Concatenando HTMLs...")
html_completo = '<html><body>\n'
for archivo in ARCHIVOS:
    filepath = os.path.join(BASE_DIR, archivo)
    if os.path.exists(filepath):
        print(f"  + {archivo}")
        with open(filepath, 'r', encoding='utf-8') as f:
            html_completo += f.read() + '\n<div style="page-break-after: always;"></div>\n'
    else:
        print(f"  ⚠️ No encontrado: {archivo}")
html_completo += '</body></html>'

# Guardar HTML temporal
temp_html = os.path.join(BASE_DIR, '_tesis_completa_temp.html')
with open(temp_html, 'w', encoding='utf-8') as f:
    f.write(html_completo)

# Convertir con pandoc
print("\nConvirtiendo con Pandoc...")
pypandoc.convert_file(
    temp_html,
    'docx',
    outputfile=OUTPUT,
    extra_args=['--resource-path=' + BASE_DIR]
)

# Limpiar temporal
os.remove(temp_html)

print(f"\n✅ Documento generado: {OUTPUT}")
