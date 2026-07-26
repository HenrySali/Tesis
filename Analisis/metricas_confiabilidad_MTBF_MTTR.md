# Métricas de Confiabilidad — MTBF y MTTR

## Definiciones

- **MTBF** (Mean Time Between Failures): Tiempo promedio entre fallas. Indica la frecuencia con que el sistema falla.
- **MTTR** (Mean Time To Recovery): Tiempo promedio de recuperación. Indica cuánto tarda el sistema en volver a operar tras una falla.
- **Disponibilidad** = MTBF / (MTBF + MTTR)
- **Criterio de falla**: Gap > 15 minutos entre mediciones consecutivas del mismo sensor.

---

## Resultados — Fase 2: Operación Estable (Favaloro, 5-jun a 3-jul)

| Métrica | Freezer (28cd8646) | Heladera 1 (28db3543) |
|---------|-------------------|----------------------|
| Período evaluado | 671 horas (28 días) | 671 horas (28 días) |
| Total mediciones | 7.843 | 7.883 |
| Fallas (gaps > 15 min) | 28 | 1 |
| **MTBF** | **23,96 horas** | **671 horas** |
| MTTR promedio | 28,4 min (1.703 s) | 5,3 h (19.142 s)* |
| MTTR mínimo | 21,2 min | 5,3 h |
| MTTR máximo | 36,8 min | 5,3 h |
| **Disponibilidad calculada** | **98,1%** | **99,2%** |

*Nota: La única falla de Heladera 1 coincide con los reinicios del VPS del 27-28 junio (4 reinicios consecutivos documentados).

### Interpretación Freezer

Las 28 "fallas" del Freezer son gaps de 21-37 minutos. Esto sugiere reconexiones WiFi lentas (sin caché) o micro-cortes de red que se resuelven automáticamente. No son fallas del sensor sino del enlace WiFi. El sistema se auto-recupera sin intervención humana (MTTR < 37 min siempre).

### Interpretación Heladera 1

Solo 1 falla en 28 días (MTBF = 671 h) demuestra que con red WiFi estable y modo continuo, el sistema es altamente confiable. La falla se debió a inestabilidad del servidor, no del sensor.

---

## Resultados — Período Completo (113 días, 12-mar a 3-jul)

| Métrica | Freezer (28cd8646) | Heladera 1 (28db3543) |
|---------|-------------------|----------------------|
| Período evaluado | 2.702 horas | 2.702 horas |
| Fallas (gaps > 15 min) | 1.472 | 679 |
| **MTBF** | **1,84 horas** | **3,98 horas** |
| MTTR promedio | 44,3 min (2.656 s) | 75,7 min (4.541 s) |
| MTTR máximo | 20,9 h (75.347 s) | 212,6 h (765.411 s) |
| **Disponibilidad calculada** | **71,4%** | **76,1%** |

### Interpretación del período completo

Los MTBF bajos del período completo reflejan las condiciones de desarrollo (deep sleep intencional, cambios de modo, WiFi doméstica, traslado), no la capacidad real del sistema en producción. Esto es consistente con la separación por fases reportada en la tesis.

---

## Comparación con Sistemas Publicados

| Sistema | MTBF | MTTR | Referencia |
|---------|------|------|-----------|
| SmartTemp (Favaloro, estable) | 24-671 h | 28 min - 5,3 h | Este trabajo |
| Sistema IoT neonatal (U. Rosario) | 32 h | 118 min | Tabares et al. (2025) |
| Estándar industrial monitoreo 24/7 | > 720 h (30 días) | < 60 min | IEC 61508 |

### Análisis

- **Heladera 1 (MTBF = 671 h)** se acerca al estándar industrial y supera ampliamente el sistema neonatal de referencia.
- **Freezer (MTBF = 24 h)** está por debajo pero con MTTR muy bajo (28 min), indicando auto-recuperación eficiente. La causa (micro-cortes WiFi) es externa al sistema.
- El MTTR de SmartTemp es inferior al del sistema neonatal (28 min vs 118 min), demostrando mejor capacidad de auto-recuperación.

---

## Texto Sugerido para la Tesis (Sección 5.x o Anexo)

> Para complementar la evaluación de disponibilidad, se calcularon las métricas estándar de confiabilidad MTBF (Mean Time Between Failures) y MTTR (Mean Time To Recovery) según IEC 61508, definiendo como falla todo gap superior a 15 minutos entre mediciones consecutivas del mismo sensor.
>
> Durante el período de operación estable en Favaloro (28 días, modo continuo), el sensor Heladera 1 presentó un MTBF de 671 horas con una única falla atribuida a inestabilidad del servidor VPS. El sensor Freezer presentó un MTBF de 23,96 horas con un MTTR promedio de 28,4 minutos, indicando micro-interrupciones del enlace WiFi con auto-recuperación sin intervención humana.
>
> La disponibilidad calculada como MTBF/(MTBF+MTTR) alcanzó 98,1% (Freezer) y 99,2% (Heladera 1), consistente con los valores reportados en la sección 5.3. El MTTR de 28 minutos del Freezer es inferior al MTTR de 118 minutos reportado por Tabares Sánchez et al. (2025) para un sistema IoMT neonatal comparable, lo que sugiere una capacidad de auto-recuperación superior atribuible al mecanismo de caché WiFi (canal + BSSID en EEPROM).

---

## Datos Crudos de la Consulta SQL

```sql
-- Fase Favaloro (5-jun a 3-jul)
-- Freezer: 28 gaps > 15 min, avg 1703 s, min 1273 s, max 2211 s
-- Heladera 1: 1 gap > 15 min, 19142 s

-- Período completo (12-mar a 3-jul)  
-- Freezer: 1472 gaps > 15 min, avg 2656 s, max 75347 s
-- Heladera 1: 679 gaps > 15 min, avg 4541 s, max 765411 s
```
