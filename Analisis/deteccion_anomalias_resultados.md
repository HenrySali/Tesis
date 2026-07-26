# Detección Automática de Anomalías Térmicas — Resultados

## Objetivo

Demostrar que un algoritmo simple (amplitud por ventana temporal + fuera de rango) puede detectar automáticamente la anomalía de la cámara de frío de Favaloro, sin intervención humana. Esto responde a la falta #1 identificada en la auditoría: "ausencia de componente de IA/ML".

---

## Método

Se aplicaron 2 métodos de detección sobre los datos del sensor Freezer (28cd8646) durante el período Favaloro (8-jun a 3-jul, 7.151 mediciones):

### Método 1: Amplitud por ventana horaria
- Se calcula `max(T) - min(T)` para cada hora
- Se clasifica la ventana según la amplitud

### Método 2: Fuera de rango absoluto
- Rango aceptable para heladera: 2°C a 8°C
- Toda medición fuera de ese rango se marca como anomalía

---

## Resultados

### Clasificación de ventanas horarias (600 ventanas evaluadas)

| Clasificación | Ventanas | % | Interpretación |
|--------------|----------|---|----------------|
| 0-2 °C (normal estable) | 207 | 34,5% | Cámara apagada o en equilibrio |
| 2-5 °C (variación moderada) | 239 | 39,8% | Comportamiento aceptable |
| 5-10 °C (excesiva) | 108 | 18,0% | Ciclo de compresión con amplitud elevada |
| **>10 °C (anomalía severa)** | **46** | **7,7%** | **Ciclo con amplitud > 10 °C → ALERTA** |

- **Amplitud media de las ventanas anómalas**: 11,87 °C
- **Amplitud máxima detectada**: 17,25 °C
- **Amplitud media global**: 3,80 °C

### Fuera de rango (2-8 °C)

| Condición | Mediciones | % |
|-----------|-----------|---|
| Bajo rango (< 2 °C) | 1.971 | 27,6% |
| Sobre rango (> 8 °C) | 3.627 | 50,7% |
| **En rango (2-8 °C)** | **1.553** | **21,7%** |

**Solo el 21,7% de las mediciones de la cámara de Favaloro estuvieron dentro del rango aceptable (2-8°C).**

---

## Interpretación

1. El algoritmo de amplitud horaria detecta correctamente las 46 horas con ciclos de compresión anómalos (>10°C).
2. El 78,3% de las mediciones estuvieron fuera de rango — la cámara tiene un problema de regulación severo.
3. Un umbral simple de amplitud >10°C por hora es suficiente para disparar una alerta automática de "equipo defectuoso".
4. No se necesita ML complejo: un condicional (`if amplitud_hora > 10: alerta()`) resuelve la detección.

---

## Propuesta de implementación en SmartTemp

```javascript
// En el backend (Node.js), cada hora:
async function detectarAnomaliaCiclo(sensorId) {
  const mediciones = await getUltimaHora(sensorId); // 12 mediciones
  const temps = mediciones.map(m => m.temperatura);
  const amplitud = Math.max(...temps) - Math.min(...temps);
  
  if (amplitud > 10) {
    await enviarAlerta({
      tipo: 'anomalia_ciclo',
      sensor: sensorId,
      amplitud: amplitud,
      mensaje: `Amplitud de ${amplitud.toFixed(1)}°C en última hora. Posible falla en compresor o termostato.`
    });
  }
}
```

---

## Texto Sugerido para la Tesis (Anexo o Sección 5.x)

> Como prueba de concepto de detección automática de anomalías, se aplicó un algoritmo de amplitud por ventana horaria sobre los datos del período Favaloro. Se calculó la diferencia entre la temperatura máxima y mínima de cada hora (ventanas de 12 mediciones). De las 600 ventanas evaluadas, 46 (7,7%) presentaron amplitud superior a 10 °C, clasificadas como "anomalía severa". La amplitud máxima detectada fue de 17,25 °C.
>
> Complementariamente, se evaluó el porcentaje de mediciones dentro del rango aceptable (2-8 °C): solo el 21,7% cumplió este criterio, confirmando que la cámara presentaba un problema de regulación térmica.
>
> Estos resultados demuestran que un algoritmo basado en reglas (amplitud horaria > umbral) es suficiente para la detección automática de anomalías en equipos de frío, sin requerir modelos de aprendizaje automático. La implementación de esta lógica en el backend de SmartTemp permitiría generar alertas proactivas ante degradación del equipo, complementando las alertas reactivas por umbral existentes.

---

## Datos Crudos (consultas SQL verificadas)

```sql
-- Ventanas horarias con amplitud > 10°C
-- Resultado: 46 ventanas, amplitud media 11.87°C, máxima 17.25°C

-- Distribución de amplitudes:
-- 0-2°C: 207 (34.5%), 2-5°C: 239 (39.8%), 5-10°C: 108 (18.0%), >10°C: 46 (7.7%)

-- Fuera de rango 2-8°C:
-- Bajo: 1971 (27.6%), Sobre: 3627 (50.7%), En rango: 1553 (21.7%)
```
