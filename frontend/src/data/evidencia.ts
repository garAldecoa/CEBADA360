/**
 * Catálogo de las figuras oficiales del notebook CEBADA360 (paquetes resultados_cebada360_I1_I2, resultados_I3 y
 * resultados_app). Cada cifra de los textos sale del CSV indicado en «fuentes» o del resultado verificado del manual
 * del Integrante 5 (sección 16). Las imágenes se copian sin modificar a public/figs/evidencia/<ruta original>.
 */

export type Figura = {
  id: string
  titulo: string
  /** Ruta dentro del paquete oficial (también es la ruta en public/figs/evidencia/) */
  archivo: string
  paso: string
  responsable: string
  queMuestra: string
  resultados: string[]
  lectura: string
  fuentes: string[]
  /** Cifra destacada en la tarjeta */
  destacado?: { valor: string; etiqueta: string }
}

export type Seccion = {
  id: string
  titulo: string
  resumen: string
  figuras: Figura[]
}

export const SECCIONES: Seccion[] = [
  {
    id: "datos",
    titulo: "Datos y territorio",
    resumen: "Cómo se limpiaron las imágenes de satélite, cómo se describió el ciclo del cultivo y por qué la validación se diseñó como se diseñó.",
    figuras: [
      {
        id: "mapa", titulo: "Ubicación de las 197 parcelas y rendimiento observado", archivo: "figs/mapa_parcelas.png",
        paso: "Paso 5", responsable: "Integrante 1",
        queMuestra: "Izquierda: las 138 parcelas de entrenamiento (círculos) y las 59 de predicción (triángulos) por municipio. Derecha: el rendimiento observado de las 138 en una escala de rojo (bajo) a verde (alto).",
        resultados: [
          "Las 59 parcelas a estimar están intercaladas con las de entrenamiento: no hay una región nueva sin datos.",
          "El rendimiento tiene un patrón geográfico claro: Calpulalpan y Singuilucan rinden menos (≈2.5–3.5 t/ha) que Chignahuapan y Almoloya (≈4.5–5 t/ha).",
          "Ese patrón espacial es la razón por la que el modelo final se apoya en la ubicación (vecinas, municipio y proceso gaussiano).",
        ],
        lectura: "Es una descripción del territorio: el rendimiento observado es de un solo ciclo (PV 2025).",
        fuentes: ["outputs/coordenadas_parcelas.csv", "outputs/parcelas.geojson"],
      },
      {
        id: "distancias", titulo: "¿Qué validación imita la situación real?", archivo: "figs/validacion_distancias.png",
        paso: "Paso 5", responsable: "Integrante 1",
        queMuestra: "Distancia de cada parcela de prueba a la parcela de entrenamiento más cercana con cuatro esquemas de validación, comparada con la distancia real entre las 59 y las 138 (barras grises).",
        resultados: [
          "Distancia mediana real de las 59 a una parcela con dato: 0.349 km.",
          "La validación estratificada por municipio reproduce esa situación (mediana 0.423 km); los bloques espaciales (3.453 km) y dejar un municipio fuera (4.847 km) simulan regiones nuevas.",
          "Por eso el RMSE oficial se mide con la validación estratificada por municipio.",
        ],
        lectura: "La validación estratificada mide interpolación local; la espacial, extrapolación a zonas nuevas (ver paso 21).",
        fuentes: ["outputs/comparacion_esquemas_validacion.csv", "resultados_I3/validacion_espacial.csv"],
        destacado: { valor: "0.349 km", etiqueta: "distancia mediana de las 59 a una parcela con dato" },
      },
      {
        id: "planet", titulo: "Limpieza de la serie NDVI de Planet", archivo: "figs/planet_ndvi_ejemplos.png",
        paso: "Paso 3", responsable: "Integrante 1",
        queMuestra: "Serie diaria de NDVI de Planet en tres parcelas de ejemplo (2.5, 4.38 y 5.53 t/ha). Los puntos verdes son observaciones válidas; las «x» rojas son caídas bruscas aisladas que se excluyeron.",
        resultados: [
          "Planet con ≤ 20 % de nubes aporta 32,257 observaciones de las 197 parcelas.",
          "La curva muestra el ciclo del cultivo: suelo desnudo hasta junio, subida en julio, pico en agosto-septiembre y secado en octubre-noviembre.",
          "Solo se quitan puntos aislados (no rachas), para no borrar cambios reales del cultivo.",
        ],
        lectura: "Paso 3 · NDVI Planet de parcelas de ejemplo; las «x» rojas son caídas bruscas excluidas.",
        fuentes: ["outputs/planet_clean_nub20.csv", "outputs/quality_features.csv"],
      },
      {
        id: "sensores", titulo: "Planet contra Sentinel-2: mismo índice, distinto sensor", archivo: "figs/planet_vs_s2_ndvi.png",
        paso: "Paso 3", responsable: "Integrante 1",
        queMuestra: "NDVI de Planet contra NDVI de Sentinel-2 en la misma parcela y el mismo día (7,199 pares).",
        resultados: [
          "Correlación muy alta (r = 0.99), pero los puntos quedan por encima de la diagonal: Planet da NDVI sistemáticamente más alto, sobre todo en valores bajos.",
          "Por eso la app muestra Planet y Sentinel-2 por separado y nunca los mezcla en una misma serie.",
        ],
        lectura: "Paso 3 · el mismo índice en dos sensores no es directamente comparable.",
        fuentes: ["outputs/planet_clean_nub20.csv", "outputs/s2_clean_nub20.csv"],
        destacado: { valor: "r = 0.99", etiqueta: "pero con desplazamiento sistemático" },
      },
      {
        id: "fenologia", titulo: "Fenología: suavizado Whittaker y doble joroba", archivo: "figs/curvas_fenologia_revision.png",
        paso: "Paso 8", responsable: "Integrante 2",
        queMuestra: "18 curvas de NDVI de Planet (columnas: rendimiento bajo, medio y alto) con el suavizado Whittaker λ = 200. Las líneas verdes marcan subida y secado; la roja, el pico.",
        resultados: [
          "Whittaker λ = 200 tiene el menor error frente a las observaciones: 0.023 de NDVI, contra 0.024 (Savitzky-Golay), 0.028 (λ = 1000) y 0.029 (mediana móvil 21 d).",
          "Varias parcelas muestran «doble joroba» (un verdor temprano en junio-julio y luego el cultivo), que se marca como bandera de calidad.",
          "Las curvas de parcelas de alto y bajo rendimiento se parecen mucho: el NDVI por sí solo distingue poco el rendimiento (ver pregunta guía 1).",
        ],
        lectura: "Ese 0.023 es error de NDVI, no de rendimiento. El secado puede caer después de octubre: observación posterior, no anticipo de cosecha.",
        fuentes: ["outputs/comparacion_suavizados.csv", "outputs/features_fenologia_whittaker.csv"],
        destacado: { valor: "0.023", etiqueta: "error de NDVI de Whittaker λ = 200" },
      },
      {
        id: "siembra", titulo: "Siembra implícita estimada con satélite", archivo: "figs/13_siembra_implicita.png",
        paso: "Paso 13", responsable: "Integrante 2",
        queMuestra: "Día del año de siembra estimado como «subida del NDVI − 45 días», comparado con el 1 de mayo que indicaron los organizadores (P2).",
        resultados: [
          "La siembra implícita va de finales de abril a mediados de julio (mediana: 24 de mayo): no todas siembran el 1 de mayo.",
          "Con esta ventana el modelo vecinas + lluvia + amplitud logra RMSE 0.4963, contra 0.5030 con el calendario fijo P2 y 0.5030 con el ciclo de Doña Josefa.",
          "Por eso las variables de clima «del crecimiento» se calculan con la ventana de cada parcela.",
        ],
        lectura: "La siembra implícita es una aproximación desde NDVI, no una fecha observada.",
        fuentes: ["outputs/siembra_implicita_vs_P2.csv", "outputs/comparacion_ventanas_etapas.csv"],
      },
    ],
  },
  {
    id: "modelo",
    titulo: "Elección del modelo",
    resumen: "Qué modelos se compararon, qué variables entran y por qué el ensamble final es como es.",
    figuras: [
      {
        id: "comparacion", titulo: "Comparación de 10 modelos", archivo: "resultados_I3/figs/comparacion_modelos.png",
        paso: "Pasos B y G", responsable: "Integrante 3",
        queMuestra: "RMSE de validación (5 folds × 10 repeticiones, estratificada por municipio) de cada modelo, con su desviación entre repeticiones. Azul = elegido; gris = componentes o referencia; rojo = descartados.",
        resultados: [
          "Ensamble CEBADA360: RMSE 0.4940 ± 0.0062 t/ha, MAE 0.3381, R² 0.6607.",
          "Sus componentes por separado: Ridge 0.4963, vecinas solas 0.4995, proceso gaussiano 0.5076, promedio municipal 0.5116.",
          "Los modelos de árboles (Random Forest 0.5148–0.5218, Gradient Boosting 0.5632–0.5641) quedan peor, y la media global da 0.8508.",
        ],
        lectura: "Ensamble 0.4940 vs Ridge 0.4963: diferencia de 0.0023 t/ha, pequeña. No se afirma superioridad estadística ni que sea el mejor modelo posible.",
        fuentes: ["resultados_I3/metricas_modelos.csv"],
        destacado: { valor: "0.4940 t/ha", etiqueta: "RMSE del ensamble (validación cruzada sobre las 138)" },
      },
      {
        id: "preguntas", titulo: "Las 3 preguntas guía del reto", archivo: "resultados_I3/figs/preguntas_guia.png",
        paso: "Paso D", responsable: "Integrante 3",
        queMuestra: "1) Correlación de cada índice satelital con el rendimiento; 2) cuánto mejora el RMSE cada variable climática al agregarse a las vecinas (verde = mejora); 3) RMSE de combinaciones de variables.",
        resultados: [
          "Índice: LAI de Planet (pico) tiene la mayor asociación individual (Spearman −0.22), pero agregado a las vecinas da 0.5028, peor que vecinas solas (0.4995).",
          "Clima: por asociación pesa más la amplitud térmica del crecimiento (|ρ| = 0.58); por aporte al RMSE, la lluvia y la Tmin del crecimiento (0.4979). El Ridge usa lluvia + amplitud (0.4963).",
          "Combinación: el ensamble es la mejor de las evaluadas (0.4940). Agregar 24 variables empeora (0.5319).",
        ],
        lectura: "Mayor asociación ≠ mayor aporte predictivo ≠ causa.",
        fuentes: ["resultados_I3/preguntas_guia_1_indices.csv", "resultados_I3/preguntas_guia_2_clima.csv", "resultados_I3/preguntas_guia_3_combinaciones.csv"],
      },
      {
        id: "importancia", titulo: "¿Qué pesa más en cada predicción?", archivo: "resultados_I3/figs/importancia_factores.png",
        paso: "Paso F", responsable: "Integrante 3",
        queMuestra: "Contribución media absoluta de cada factor a la predicción (descomposición aditiva del ensamble), promediada en las 197 parcelas.",
        resultados: [
          "Promedio del municipio 0.226 t/ha, patrón espacial 0.216 y vecinas 0.194: la ubicación explica casi toda la diferencia entre parcelas.",
          "Amplitud térmica (0.027) y lluvia del crecimiento (0.021) mueven poco cada predicción, aunque bajan el RMSE de 0.4995 a 0.4963.",
        ],
        lectura: "Es una descomposición aditiva contable, no SHAP ni efecto causal. Vecinas, municipio y patrón espacial dependen todos de la ubicación.",
        fuentes: ["resultados_I3/factores.csv"],
      },
      {
        id: "criterios", titulo: "Criterios de información contra error de validación", archivo: "resultados_I3/figs/paso18_criterios/18_criterios_y_validacion.png",
        paso: "Paso 18", responsable: "Integrante 3",
        queMuestra: "Izquierda: diferencia de AIC, AICc y BIC de 8 variantes del Ridge contra la mejor. Derecha: su RMSE en parcelas no vistas (rojo = modelo actual, M4).",
        resultados: [
          "M5 (M4 + amplitud²) tiene el menor AIC, pero peor RMSE de validación (0.4983 contra 0.4963 de M4).",
          "M4 (vecinas + lluvia + amplitud) tiene el menor RMSE de validación; M8 (24 variables) es claramente peor (0.5319, ΔBIC 92).",
          "Los términos no lineales (cuadrados e interacción) no mejoran la predicción.",
        ],
        lectura: "Menor AIC no garantiza predecir mejor: el criterio de decisión fue el error en parcelas no vistas.",
        fuentes: ["resultados_I3/criterios_informacion.csv"],
      },
      {
        id: "barrido", titulo: "Barrido de 272 variables no usadas", archivo: "resultados_I3/figs/paso20_barrido/20_barrido.png",
        paso: "Paso 20", responsable: "Integrante 3",
        queMuestra: "Izquierda: cambio de RMSE al agregar cada una de las 272 variables candidatas (negativo = mejora). Derecha: prueba de permutación de la mejor (n_s2_dswi2_media) contra versiones al azar.",
        resultados: [
          "La mayoría de las 272 variables empeora el modelo; la mejor baja el RMSE solo 0.0068 t/ha.",
          "Esa mejora tiene p = 0.015 sola, pero p = 1.0 con la corrección de Bonferroni por haber probado 272.",
          "Elegir variables por barrido empeora fuera de muestra (0.5131 contra 0.4961): ninguna variable nueva entra al modelo.",
        ],
        lectura: "Es la «maldición del ganador»: con muchas pruebas, alguna mejora aparece por azar.",
        fuentes: ["resultados_I3/barrido_resumen.csv", "resultados_I3/barrido_variables.csv"],
        destacado: { valor: "272", etiqueta: "variables probadas · ninguna entra" },
      },
      {
        id: "pesos", titulo: "¿Pesos optimizados en lugar de 1/3?", archivo: "resultados_I3/figs/paso23_pesos/23_pesos_ensamble.png",
        paso: "Paso 23", responsable: "Integrante 3",
        queMuestra: "Izquierda: RMSE con pesos iguales contra pesos aprendidos dentro de cada fold, en dos validaciones. Derecha: dispersión de los pesos aprendidos (la línea punteada es 1/3).",
        resultados: [
          "Validación estratificada: pesos iguales 0.4959 contra optimizados 0.4974.",
          "Bloques espaciales: 0.6011 contra 0.6047.",
          "Los pesos aprendidos cambian mucho de un fold a otro (el del Ridge llega a 0.9): optimizarlos no ayuda y se conservan los pesos fijos de 1/3.",
        ],
        lectura: "Pesos fijos también evitan fuga de información: no se ajustan con los datos que se evalúan.",
        fuentes: ["resultados_I3/pesos_ensamble_comparacion.csv", "resultados_I3/pesos_ensamble_por_fold.csv"],
      },
    ],
  },
  {
    id: "validacion",
    titulo: "Validación y límites",
    resumen: "Qué tan confiable es el error reportado, qué pasa lejos de las parcelas con dato y si más datos mejorarían el modelo.",
    figuras: [
      {
        id: "espacial", titulo: "Validación espacial: error según la distancia", archivo: "resultados_I3/figs/paso21_validacion_espacial/21_validacion_espacial.png",
        paso: "Paso 21", responsable: "Integrante 3",
        queMuestra: "Izquierda: el mismo ensamble con cuatro validaciones, de vecinas conocidas a región nueva. Derecha: RMSE según la distancia a la parcela de entrenamiento más cercana, contra un modelo sin ubicación.",
        resultados: [
          "Más lejos de las parcelas con dato, más error: 0.4940 (estratificada) · 0.5770 (15 bloques) · 0.6714 (8 bloques) · 0.7487 (municipio fuera).",
          "39 de las 59 están a menos de 0.5 km de una parcela con dato, donde el RMSE es 0.444; ponderando por distancia, el RMSE esperado para las 59 es 0.509.",
          "En todos los rangos de distancia el ensamble es mejor que el modelo sin ubicación.",
        ],
        lectura: "El modelo interpola bien entre parcelas cercanas; no está validado para regiones nuevas.",
        fuentes: ["resultados_I3/validacion_espacial.csv", "resultados_I3/error_por_distancia.csv"],
        destacado: { valor: "0.509", etiqueta: "RMSE esperado para las 59 según su distancia" },
      },
      {
        id: "anidada", titulo: "Validación anidada: ¿cuánto optimismo agrega elegir?", archivo: "resultados_I3/figs/paso22_validacion_anidada/22_validacion_anidada.png",
        paso: "Paso 22", responsable: "Integrante 3",
        queMuestra: "Izquierda: qué modelo gana en 15 elecciones completas repetidas dentro de la validación. Derecha: RMSE del ensamble, del ensamble fijo en las mismas particiones y del procedimiento «elegir el mejor de 10».",
        resultados: [
          "El ensamble fue elegido en 7 de 15 elecciones (pluralidad); vecinas y Ridge, 3 cada uno.",
          "El procedimiento «elegir el mejor de 10 en cada fold» da 0.5107; el ensamble fijo en esos mismos folds da 0.4997.",
          "La diferencia frente a 0.494 es el optimismo por haber elegido el modelo con los mismos datos: pequeño, del orden de 0.006–0.017 t/ha.",
        ],
        lectura: "0.5107 es del procedimiento completo de elección, no del ensamble fijo.",
        fuentes: ["resultados_I3/validacion_anidada_metricas.csv", "resultados_I3/validacion_anidada_elecciones.csv"],
      },
      {
        id: "aprendizaje", titulo: "Curva de aprendizaje: ¿más parcelas bajarían el error?", archivo: "resultados_I3/figs/paso28_curva_aprendizaje/28_curva_aprendizaje.png",
        paso: "Paso 28", responsable: "Integrante 3",
        queMuestra: "Izquierda: RMSE de validación al entrenar con 30, 50, 70, 90 y ~110 parcelas, con su incertidumbre. Derecha: ganancia de cada tramo (verde = mejora con IC 90 % > 0).",
        resultados: [
          "El RMSE baja de 0.520 (30 parcelas) a 0.495 (~110).",
          "Los tres primeros tramos mejoran de forma clara; el último (90 → ~110) aporta solo 0.0013 t/ha (IC 90 % [−0.0007, +0.0036]), no distinguible de cero.",
          "Conclusión A: compatible con una meseta de desempeño con estas variables.",
        ],
        lectura: "No demuestra un error irreducible; la extrapolación a 197 o 400 parcelas no está validada.",
        fuentes: ["resultados_I3/curva_aprendizaje_tramos.csv", "resultados_I3/curva_aprendizaje_resumen.csv"],
      },
      {
        id: "ruido", titulo: "Variabilidad residual: ¿cuánto error queda por explicar?", archivo: "resultados_I3/figs/paso25_variabilidad_residual/25_variabilidad_residual.png",
        paso: "Paso 25", responsable: "Integrante 3",
        queMuestra: "Semivariograma del rendimiento, distintas estimaciones del ruido comparadas con el RMSE, estabilidad del ruido del proceso gaussiano en 50 folds y error según cómo se reportó el rendimiento (medido o redondeado a 0.5).",
        resultados: [
          "El ruido que estima el proceso gaussiano (0.487 t/ha) equivale al 99 % del RMSE del ensamble (0.494).",
          "Queda poca variación espacial que la ubicación pueda explicar.",
          "45 de las 138 parcelas reportan el rendimiento redondeado a 0.5 t/ha; ese redondeo por sí solo aporta ≈ 0.082 t/ha de error.",
        ],
        lectura: "Diagnóstico exploratorio: compatible con una meseta. No es una cota inferior demostrada.",
        fuentes: ["resultados_I3/variabilidad_residual_resumen.csv", "resultados_I3/variabilidad_residual_semivariograma.csv"],
        destacado: { valor: "0.487 / 0.494", etiqueta: "ruido estimado / RMSE del ensamble" },
      },
    ],
  },
  {
    id: "supuestos",
    titulo: "Diagnóstico de errores",
    resumen: "Revisión de los residuales fuera de fold del ensamble (paso 17) y de las parcelas con más error (paso 26).",
    figuras: [
      {
        id: "residuales", titulo: "Residuales del ensamble", archivo: "resultados_I3/figs/paso17_supuestos/17_0_residuales.png",
        paso: "Paso 17", responsable: "Integrante 3",
        queMuestra: "Residuales fuera de fold (observado − predicho) por parcela, contra el valor predicho, observado contra predicho y por municipio.",
        resultados: [
          "Los residuales se centran en cero (prueba t: p = 0.97, no se rechaza media cero).",
          "Las predicciones forman dos grupos (≈3.0 y ≈4.5 t/ha), que corresponden a las dos zonas productivas.",
          "Los errores grandes (más de 1 t/ha) son pocos y se concentran en Chignahuapan.",
        ],
        lectura: "«No se rechaza H₀» significa que no hay evidencia en contra del supuesto, no que se cumpla.",
        fuentes: ["resultados_I3/residuales_diagnostico.csv", "resultados_I3/supuestos_resumen.csv"],
      },
      {
        id: "varianza", titulo: "Varianza constante (homocedasticidad)", archivo: "resultados_I3/figs/paso17_supuestos/17_2_varianza.png",
        paso: "Paso 17", responsable: "Integrante 3",
        queMuestra: "Tamaño del error contra el valor predicho; la línea punteada muestra la tendencia.",
        resultados: [
          "La línea es casi horizontal: el error no crece con el rendimiento predicho.",
          "Breusch-Pagan p = 0.32, White p = 0.82, Levene por municipio p = 0.22: en ninguna se rechaza la varianza constante.",
        ],
        lectura: "No se rechaza H₀: no hay evidencia de heterocedasticidad.",
        fuentes: ["resultados_I3/supuestos_resumen.csv"],
      },
      {
        id: "normalidad", titulo: "Normalidad de los errores", archivo: "resultados_I3/figs/paso17_supuestos/17_3_normalidad.png",
        paso: "Paso 17", responsable: "Integrante 3",
        queMuestra: "Histograma de los residuales contra la curva normal y su gráfica QQ.",
        resultados: [
          "Los errores NO son normales: Shapiro-Wilk p < 0.001, Jarque-Bera p < 0.001. Hay colas pesadas (unas pocas parcelas con error muy negativo).",
          "Por eso los intervalos son empíricos (cuantiles de los errores reales), no fórmulas normales: al 80 % el normal cubre 86 % con ±0.644 t/ha y el empírico 80 % con ±0.581.",
        ],
        lectura: "Rechazar la normalidad no invalida las predicciones; sí obliga a construir los intervalos con los errores observados.",
        fuentes: ["resultados_I3/supuestos_resumen.csv", "resultados_I3/intervalos_normal_vs_empirico.csv"],
      },
      {
        id: "independencia", titulo: "Independencia espacial de los errores", archivo: "resultados_I3/figs/paso17_supuestos/17_4_independencia.png",
        paso: "Paso 17", responsable: "Integrante 3",
        queMuestra: "Diagrama e índice de Moran de los residuales con sus 8 vecinas, su distribución bajo azar y el mapa de residuales.",
        resultados: [
          "Índice de Moran I = −0.063 (p = 0.13): no hay autocorrelación espacial que el modelo haya dejado sin explicar.",
          "El mapa no muestra zonas enteras sobre o subestimadas.",
        ],
        lectura: "La ubicación ya está aprovechada por el modelo; no se rechaza la independencia.",
        fuentes: ["resultados_I3/supuestos_resumen.csv"],
      },
      {
        id: "influencia", titulo: "Parcelas influyentes (Cook y leverage)", archivo: "resultados_I3/figs/paso17_supuestos/17_6_influencia.png",
        paso: "Paso 17", responsable: "Integrante 3",
        queMuestra: "Distancia de Cook y residual studentizado contra leverage en la regresión MCO auxiliar.",
        resultados: [
          "7 parcelas superan el umbral de revisión: AGC_015, AGC_034, AGC_041, AGC_171, AGC_122, AGC_127 y AGC_026.",
          "VIF máximo 1.9: sin multicolinealidad relevante.",
        ],
        lectura: "RESET, VIF y Cook son de la regresión MCO auxiliar, no del ensamble. Una parcela influyente se revisa, no se borra.",
        fuentes: ["resultados_I3/supuestos_resumen.csv"],
      },
      {
        id: "atipicos", titulo: "Parcelas atípicas: ¿las detecta el satélite?", archivo: "resultados_I3/figs/paso26_atipicos/26_atipicos.png",
        paso: "Paso 26", responsable: "Integrante 3",
        queMuestra: "Residual de cada parcela contra un índice satelital de daño, las 8 parcelas con más error y la distribución del índice en las 138 y en las 59.",
        resultados: [
          "12 parcelas atípicas concentran 58.8 % del error cuadrático (sin ellas el RMSE sería 0.332); las 8 mayores suman 49 %.",
          "El satélite no las distingue: Spearman −0.04, AUC 0.52 (p = 0.44), igual que al azar.",
          "Ninguna de las 59 cruza el umbral de alerta de daño (−2.0).",
        ],
        lectura: "Ensayo exploratorio no adoptado; el RMSE oficial no excluye a las atípicas. Los índices no diagnostican granizo, helada ni enfermedad.",
        fuentes: ["resultados_I3/atipicos_resumen.csv", "resultados_I3/atipicos_diagnostico.csv", "resultados_I3/alerta_dano_59.csv"],
        destacado: { valor: "AUC 0.52", etiqueta: "el satélite no anticipa las atípicas" },
      },
    ],
  },
  {
    id: "prediccion",
    titulo: "Predicción final",
    resumen: "Las 59 predicciones entregadas, sus controles de calidad y cómo se ven en el mapa.",
    figuras: [
      {
        id: "p59", titulo: "Las 59 predicciones con su intervalo", archivo: "resultados_I3/figs/paso19_prediccion_final/19_1_predicciones_59.png",
        paso: "Paso 19", responsable: "Integrante 3",
        queMuestra: "Cada una de las 59 predicciones (punto) con su intervalo empírico al 80 % (barra gruesa) y al 90 % (barra delgada); color = municipio.",
        resultados: [
          "Media 3.9372 t/ha; mínimo 2.8297 (AGC_120) y máximo 4.6928 (AGC_094).",
          "Intervalos empíricos: ±0.552 t/ha (80 %) y ±0.689 t/ha (90 %).",
          "Dos parcelas quedan para revisión manual: AGC_065 (banderas de calidad) y AGC_120 (su municipio tiene < 3 parcelas con dato).",
        ],
        lectura: "Intervalo empírico de referencia (nominal 80 %), sin garantía de cobertura en parcelas nuevas.",
        fuentes: ["resultados_I3/ENTREGA/predicciones_59_detalle.csv", "resultados_I3/ENTREGA/resumen_prediccion_final.txt"],
        destacado: { valor: "3.94 t/ha", etiqueta: "media de las 59 estimadas" },
      },
      {
        id: "controles", titulo: "Controles de la predicción final", archivo: "resultados_I3/figs/paso19_prediccion_final/19_2_controles.png",
        paso: "Paso 19", responsable: "Integrante 3",
        queMuestra: "Distribución de observados y predichos, calibración de la validación cruzada, predicción contra el rendimiento de sus 12 vecinas y RMSE esperado en 59 parcelas nuevas.",
        resultados: [
          "Calibración y = −0.112 + 1.027·ŷ (IC 95 % de la pendiente [0.903, 1.151]): compatible con 1, no hace falta recalibrar. Sesgo −0.0040 t/ha.",
          "Las predicciones son más concentradas que los observados: el modelo no reproduce los extremos (es un promedio).",
          "Calificación esperada en las 59 (p5 – mediana – p95): RMSE 0.369 – 0.483 – 0.620.",
        ],
        lectura: "La calificación real de las 59 solo se conocerá con la evaluación de FIRA.",
        fuentes: ["resultados_I3/ENTREGA/control_calidad.csv", "resultados_I3/ENTREGA/resumen_prediccion_final.txt"],
        destacado: { valor: "0.369–0.620", etiqueta: "RMSE esperado en las 59 (p5–p95)" },
      },
      {
        id: "estabilidad", titulo: "Mapa de predicciones y estabilidad bootstrap", archivo: "resultados_I3/figs/paso19_prediccion_final/19_3_mapa_y_estabilidad.png",
        paso: "Paso 19", responsable: "Integrante 3",
        queMuestra: "Mapa con observados (cuadros) y predichos (círculos) en la misma escala de color, y cuánto cambia cada predicción al remuestrear el entrenamiento 200 veces.",
        resultados: [
          "Cada predicción coincide con el color de sus vecinas observadas.",
          "Desviación bootstrap mediana 0.097 t/ha (máximo 0.316, AGC_120): las predicciones son estables.",
        ],
        lectura: "La desviación bootstrap mide estabilidad del entrenamiento; no es un intervalo.",
        fuentes: ["resultados_I3/ENTREGA/predicciones_59_detalle.csv"],
      },
      {
        id: "visor", titulo: "Las 4 capas del mapa", archivo: "resultados_app/capturas/visor_4_capas.png",
        paso: "Paso 29", responsable: "Integrante 4",
        queMuestra: "Vista estática de las cuatro capas del visor: rendimiento, amplitud del intervalo, pico de NDVI y probabilidad modelada de ingreso insuficiente.",
        resultados: [
          "197 polígonos, 4 capas y 18 de 18 pruebas de integridad en OK.",
          "Capas 2 y 4 solo colorean las 59 estimadas; las observadas no tienen intervalo ni crédito.",
        ],
        lectura: "La capa 2 es incertidumbre de la predicción (no riesgo); la capa 4 es una probabilidad MODELADA, no incumplimiento real.",
        fuentes: ["resultados_app/datos_visor.csv", "resultados_app/pruebas_visor.csv"],
      },
    ],
  },
  {
    id: "credito",
    titulo: "Aplicación financiera",
    resumen: "Cómo la predicción se traduce en escenarios de crédito con supuestos públicos de FIRA (simulación educativa).",
    figuras: [
      {
        id: "credito", titulo: "Crédito y escenario retrospectivo", archivo: "resultados_I4/credito_y_riesgo.png",
        paso: "Paso 24", responsable: "Integrante 4",
        queMuestra: "Izquierda: con las 138, % de parcelas cuyo ingreso simulado no alcanza a pagar si se presta la cuota FIRA a todas, contra el crédito ajustado con CEBADA360, en 6 escenarios de precio y costo. Derecha: crédito sugerido de las 59 (% de la cuota) contra su rendimiento esperado.",
        resultados: [
          "Escenario base: cuota FIRA a todas → 14 de 138 con ingreso insuficiente (10.1 %), brecha 426,564 MXN; con crédito ajustado → 10 (7.2 %), brecha 177,445 MXN.",
          "Con precio −20 % (6,000 MXN/t) la diferencia es mayor: 40.6 % contra 10.1 %; con costo +20 %, 38.4 % contra 8.0 %.",
          "Las parcelas por encima de ~4.25 t/ha reciben el 100 % de la cuota; abajo de 2.95 t/ha (umbral para pagar) el crédito sugerido baja (AGC_120: 76 %).",
        ],
        lectura: "No son impagos reales (no hay datos de préstamos). Prestar menos reduce la brecha en parte de forma mecánica: no prueba una reducción causal del riesgo crediticio.",
        fuentes: ["resultados_I4/retrospectiva_resumen.csv", "resultados_I4/sensibilidad_credito.csv", "resultados_I4/credito_por_parcela_intervalo_municipio.csv"],
        destacado: { valor: "10.1 % → 7.2 %", etiqueta: "parcelas con ingreso insuficiente simulado" },
      },
      {
        id: "municipios", titulo: "Error e intervalos por municipio", archivo: "resultados_I4/intervalos_por_municipio.png",
        paso: "Paso 27", responsable: "Integrante 4",
        queMuestra: "Izquierda: RMSE fuera de muestra del ensamble por municipio, con IC 90 % (rojo = intervalo ampliado). Derecha: cobertura exploratoria del intervalo nominal 80 %.",
        resultados: [
          "Chignahuapan (71 parcelas) tiene el mayor error con muestra suficiente (RMSE 0.582) y usa un intervalo ampliado de forma precautoria (diferencia no significativa, p = 0.136).",
          "Cobertura exploratoria total 0.783 → 0.790. En Calpulalpan es 73 % (30 parcelas, no significativa).",
          "Municipios con 1 parcela (Nanacamilpa, Tepeapulco, Apan): n insuficiente para un intervalo propio.",
        ],
        lectura: "No garantiza 80 % por municipio. En Chignahuapan el intervalo se amplía sobre todo hacia arriba; el crédito casi no cambia.",
        fuentes: ["resultados_I4/error_por_municipio.csv", "resultados_I4/cobertura_intervalos_municipio.csv"],
      },
    ],
  },
]
