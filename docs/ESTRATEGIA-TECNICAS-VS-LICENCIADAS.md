# Estrategia NurseLite: Licenciadas vs Tecnicas en Enfermeria

> Fecha: 2026-02-12
> Decision: SOLO LICENCIADAS (Fase 1)
> Status: VALIDADO por analisis legal + marketing + insight de campo

---

## 1. Contexto y Descubrimiento

### Insight de campo (fuente: enfermera licenciada, clinica La Molina)

- En Peru, las **tecnicas en enfermeria** son quienes realizan la mayoria de servicios basicos (inyectables, cuidado adulto mayor, curaciones)
- Las tecnicas superan 3:1 a las licenciadas en instituciones de salud
- Sin embargo, incluir tecnicas implica costos legales significativos por requisito de supervision

### Demanda real observada (La Molina, zona adulto mayor)

- Pacientes van a clinica un sabado: "Necesito ponerme este medicamento todos los dias, el domingo quien me pondra?"
- Pacientes van SOLO para tomarse la presion arterial
- Pacientes van SOLO para inyectables simples
- Conclusion: procedimientos que una enfermera puede hacer en domicilio

---

## 2. Decision: Solo Licenciadas CEP

### Por que NO incluir tecnicas (por ahora)

| Factor | Solo Licenciadas | Con Tecnicas |
|--------|-----------------|--------------|
| Supervision requerida | NO | SI (Art. 23 Ley General de Salud) |
| Inversion legal | S/.6,500-15,000 | S/.12,000-28,000 |
| Complejidad operativa | Baja | Alta (supervisora 24/7) |
| Riesgo SUSALUD | Bajo | Medio-Alto |
| Registro IPRESS | NO necesario | Posiblemente necesario |
| Autonomia profesional | Total | Requiere supervision |
| Catalogo de servicios | Completo (IM, SC, IV, vias, sondajes) | Limitado para tecnicas |

### Ventajas del modelo solo licenciadas

1. **Verificacion simple:** CEP online (cep.org.pe) confirma estado HABIL
2. **Sin supervision:** Cada enfermera opera con autonomia profesional total
3. **Marketplace puro:** NurseLite es intermediario tecnologico, no prestador
4. **Menor exposicion legal:** ~70-80% menos riesgo vs modelo con tecnicas
5. **Premium positioning:** NSE A/B de La Molina ya paga esto en clinicas
6. **Catalogo completo:** Licenciadas pueden hacer TODO (IV, sondajes, post-op, etc.)

---

## 3. Marco Legal (Modelo Solo Licenciadas)

### Base legal

- **Ley N 27669** (Ley del Trabajo de la Enfermera/o): Reconoce enfermeria como "profesion autonoma"
- **D.S. 004-2007-SA** (Reglamento): Enfermeras pueden ejercer independientemente en domicilios
- **Ley General de Salud N 26842, Art. 26**: Solo exige supervision para tecnicos/auxiliares, NO para licenciadas

### Requisitos legales minimos

| Item | Costo | Plazo |
|------|-------|-------|
| Revision/actualizacion T&C | S/.2,000-4,000 | 1-2 semanas |
| Plantilla Consentimiento Informado digital | S/.0 (desarrollo interno) | 1 semana |
| Contrato marco con enfermeras | S/.1,500-3,000 | 1 semana |
| Seguro RC para NurseLite (plataforma) | S/.3,000-8,000/ano | 3-5 dias |
| **TOTAL** | **S/.6,500-15,000** | **2-3 semanas** |

### T&C - Disclaimers criticos

```
"NurseLite es una plataforma tecnologica que conecta pacientes con enfermeras
profesionales independientes verificadas por el Colegio de Enfermeros del Peru (CEP).

- NurseLite NO es un establecimiento de salud ni presta servicios medicos directamente.
- Las enfermeras registradas son profesionales autonomos responsables de su propia
  practica profesional.
- NurseLite verifica la licencia CEP vigente y estado HABIL, pero no supervisa
  la ejecucion tecnica de los procedimientos.
```

### Consentimiento informado (Ley N 29414, Art. 15)

Implementar formulario digital pre-servicio:
- Procedimiento a realizar
- Riesgos y beneficios
- Derecho a rechazar/interrumpir
- Firma digital del paciente

### Seguros recomendados

1. **RC Plataforma** (obligatorio): S/.3,000-8,000/ano - cubre errores verificacion, fallas tech
2. **RC Individual enfermeras** (recomendado): S/.800-2,000/ano por enfermera
3. **Seguro cibernetico** (futuro, >5,000 usuarios): S/.5,000-12,000/ano

### Re-verificacion CEP

- **Cada 30 dias** verificar estado HABIL automaticamente (la colegiatura CEP se paga mensualmente)
- Si enfermera pierde licencia y NurseLite sigue conectandola = responsabilidad por negligencia
- Automatizar via scraping/API a cep.org.pe al inicio de cada mes

---

## 4. Consentimiento Informado Digital (Detalle)

> Base legal: Ley N 29414, Art. 15 (derechos de usuarios de servicios de salud)

### Contenido obligatorio del formulario

1. **Datos del paciente:** Nombre completo, DNI, direccion del servicio
2. **Datos de la enfermera:** Nombre, CEP, especialidad
3. **Procedimiento:** Descripcion clara del servicio a realizar
4. **Indicacion medica:** Referencia a la prescripcion medica (si aplica)
5. **Riesgos y beneficios:** Riesgos inherentes al procedimiento, beneficios esperados
6. **Alternativas:** Otras opciones disponibles (ej: acudir a centro de salud)
7. **Derecho a rechazar:** El paciente puede interrumpir el servicio en cualquier momento
8. **Firma digital:** Aceptacion del paciente (valida per Ley N 27269 de Firmas Digitales)
9. **Fecha y hora:** Timestamp automatico

### Implementacion en NurseLite

- Formulario digital pre-servicio dentro de la app
- El paciente firma (checkbox + boton) antes de que inicie el servicio
- Se genera PDF automatico almacenado en la plataforma
- **No requiere firma notarial** - las firmas digitales tienen validez legal en Peru (Ley 27269)

---

## 5. Seguro de Responsabilidad Civil (RC) - Detalle

### Que es el Seguro RC

Seguro que cubre danos a terceros derivados de la actividad profesional o empresarial. Protege ante demandas por danos y perjuicios.

### RC para NurseLite (plataforma)

| Aspecto | Detalle |
|---------|---------|
| **Que cubre** | Errores en verificacion CEP, fallas tecnologicas, filtracion de datos, errores en matching |
| **Que NO cubre** | Negligencia medica de la enfermera (eso lo cubre el RC individual) |
| **Costo estimado** | S/.3,000-8,000/ano |
| **Aseguradoras** | Rimac, Pacifico, La Positiva, Mapfre |
| **Prioridad** | OBLIGATORIO antes de lanzar |

### RC Individual para enfermeras

| Aspecto | Detalle |
|---------|---------|
| **Que cubre** | Negligencia profesional, danos al paciente durante el servicio |
| **Costo estimado** | S/.800-2,000/ano por enfermera |
| **Quien paga** | La enfermera (NurseLite puede facilitar acceso grupal) |
| **Prioridad** | RECOMENDADO (no bloqueante para lanzar) |

### Estrategia de seguros por fase

1. **Pre-lanzamiento:** RC Plataforma (obligatorio)
2. **Mes 3-6:** Facilitar RC individual grupal para enfermeras (menor costo por volumen)
3. **>5,000 usuarios:** Seguro cibernetico (S/.5,000-12,000/ano)

---

## 6. Terminos y Condiciones (T&C) - Puntos para Abogado

### Puntos criticos que el abogado debe revisar/redactar

1. **Naturaleza juridica de NurseLite:** Definir claramente como intermediario tecnologico, NO prestador de salud
2. **Responsabilidad solidaria:** Delimitar hasta donde responde NurseLite vs la enfermera (Ley 29571, Codigo de Proteccion al Consumidor)
3. **Verificacion CEP:** Que NurseLite verifica licencia vigente pero NO supervisa ejecucion tecnica
4. **Proteccion de datos sensibles:** Cumplimiento de Ley 29733 (datos medicos = datos sensibles, requieren consentimiento explicito)
5. **Politica de cancelacion:** Tiempos, penalidades, reembolsos
6. **Disputas y reclamaciones:** Mecanismo interno + via INDECOPI
7. **Jurisdiccion:** Tribunales de Lima
8. **Limitacion de responsabilidad:** Tope de indemnizacion por la plataforma

### Documentos legales necesarios

| Documento | Requiere notario? | Costo estimado |
|-----------|-------------------|----------------|
| T&C de la plataforma | NO | S/.2,000-4,000 (abogado) |
| Politica de privacidad | NO | Incluido en T&C |
| Consentimiento informado digital | NO | S/.0 (desarrollo interno) |
| Contrato marco con enfermeras | NO (firma digital valida) | S/.1,500-3,000 (abogado) |
| Registro INDECOPI (marca) | NO (tramite online) | S/.534.99 |

### Nota sobre documentos notariales

**NO se requieren documentos notariales** para operar NurseLite como plataforma tecnologica:
- La Ley N 27269 (Ley de Firmas y Certificados Digitales) otorga validez legal a firmas digitales
- Los T&C se aceptan digitalmente (click-wrap agreement)
- El contrato con enfermeras puede ser digital con firma electronica
- Solo se requeriria notario si se constituyera una sociedad formal (SAC, SRL) pero eso es tema corporativo, no operativo

---

## 7. Servicios que Licenciadas Pueden Ofrecer a Domicilio

### Procedimientos invasivos
- Inyectables IM, SC, IV
- Colocacion de vias perifericas
- Sondajes (vesical, nasogastrico, rectal)
- Curaciones complejas (heridas quirurgicas, ulceras, quemaduras)
- Aspiracion de secreciones

### Cuidados especializados
- Post-operatorio inmediato (monitoreo, drenajes, complicaciones)
- Administracion de medicacion controlada (con receta medica)
- Terapia respiratoria (nebulizaciones)
- Valoracion de enfermeria (triage, riesgo caidas)

### Cuidados cronicos/paliativos
- Pacientes oncologicos (control sintomas)
- Diabeticos (insulinoterapia, pie diabetico)
- Geriatricos complejos (polifarmacia, comorbilidades)

---

## 8. Estrategia de Marketing: Premium Focalizado

### Posicionamiento

> "Enfermeras universitarias certificadas, verificadas por el Colegio de Enfermeros del Peru. En tu casa, cuando las necesites."

### Diferenciadores comunicables

1. "Solo licenciadas universitarias" (5 anos formacion)
2. "Verificacion triple" (CEP + RENIEC + Biometria)
3. "Sin supervision requerida" = Autonomia profesional total
4. "Registro publico verificable" (cep.org.pe)
5. "Disponible 24/7, incluidos domingos y feriados"

### Copy principal (pain point del domingo)

> "El domingo quien te pone tu inyeccion?
> Enfermeras licenciadas verificadas por el CEP.
> En tu casa. Cuando las necesites. Incluso domingos y feriados."

### Segmentacion geografica (lanzamiento por fases)

| Fase | Distrito | Poblacion adulto mayor | Timeline |
|------|----------|----------------------|----------|
| 1 | La Molina | ~45,000 (25%) | Mes 1-2 |
| 2 | San Borja + Surco | ~110,000 (20-30%) | Mes 3-4 |
| 3 | Miraflores + San Isidro | ~52,000 (35-40%) | Mes 5-6 |

**Mercado inicial total:** ~200,000 adultos mayores en 5 distritos NSE A/B

### Canales por fase

**La Molina (Fase 1):**
- Meta Ads geofencing radio 3km (S/.2,000)
- Google Ads: "enfermera a domicilio la molina", "inyectable domingo la molina"
- Alianzas con farmacias (flyers en counter de inyectables)

### KPIs de validacion (primeros 3 meses)

| Metrica | Target |
|---------|--------|
| Tasa recompra 30 dias | >25% |
| CAC | <S/.80 |
| NPS | >50 |
| Rating promedio | >4.5 |
| Conversion landing | >15% |

---

## 9. Tecnicas en Enfermeria: Fase 2 (Postergada)

### Cuando considerar incluir tecnicas

- >500 servicios/mes completados
- Flujo de caja positivo consistente
- >30% abandona por precio Y >50% servicios son basicos
- Equipo legal maduro

### Timeline realista: No antes de mes 9-12

### Requisitos si se decide incluir tecnicas

1. Consultoria legal completa (S/.3,000-5,000)
2. Enfermera supervisora 24/7 contratada
3. Seguro RC ampliado
4. Verificacion MINSA (prosalud.minsa.gob.pe/titulo/)
5. Limitacion de servicios (NO vias IV para tecnicas)
6. Posible registro IPRESS ante SUSALUD

### Comunicacion mientras tanto

Si preguntan "tendran opcion mas economica?":
> "NurseLite se enfoca exclusivamente en enfermeras licenciadas universitarias
> para garantizar el mas alto estandar de atencion."

NO decir: "Estamos evaluando incluir tecnicas" (comunica inseguridad)

---

## 10. Nombre "NurseLite"

### Decision: NO cambiar

- "Nursing" en ingles = cuidado de salud (no solo enfermera licenciada)
- Mercado peruano NSE B/C+ asocia ingles con profesionalismo/tecnologia
- Ya hay inversion en dominio, SEO, redes sociales
- "Lite" sugiere accesibilidad y facilidad

### Si en el futuro se incluyen tecnicas

- El nombre sigue funcionando (nursing = cuidado general)
- Educar con posicionamiento, no renombrar

---

## 11. Proximos Pasos Inmediatos

### Semana 1-2: Legal
- [ ] Buscar abogado de salud (CAL seccion Derecho de Salud)
- [ ] Revisar/actualizar T&C (presupuesto: S/.2,000-4,000)
- [ ] Cotizar seguro RC plataforma (Rimac, Pacifico, La Positiva)
- [ ] Email consulta a SUSALUD sobre plataformas digitales de salud

### Semana 3-4: App
- [ ] Implementar formulario consentimiento informado digital
- [ ] Actualizar disclaimers en pantallas de confirmacion
- [ ] Sistema re-verificacion CEP automatica (cada 30 dias)
- [ ] Contrato marco digital para enfermeras

### Mes 2: Marketing La Molina
- [ ] Actualizar landing con positioning premium
- [ ] Campana Meta Ads geofencing La Molina (S/.2,000)
- [ ] Campana Google Ads keywords La Molina (S/.1,500)
- [ ] Alianza con 3 farmacias en La Molina

---

## Apendice: Leyes y Normativas Relevantes

| Normativa | Relevancia |
|-----------|------------|
| Ley N 27669 (Trabajo de Enfermera/o) | Autonomia profesional de licenciadas |
| D.S. 004-2007-SA (Reglamento) | Ejercicio independiente en domicilios |
| Ley General de Salud N 26842 | Art. 23: supervision tecnicas. Art. 26: autonomia licenciadas |
| Ley N 29414 | Derechos usuarios servicios de salud (consentimiento informado) |
| Ley N 29733 | Proteccion datos personales (datos medicos = sensibles) |
| Ley N 29571 | Proteccion al consumidor (responsabilidad solidaria) |
| Ley N 29344 | Marco SUSALUD (supervision IPRESS) |
| D.S. N 013-2006-SA | Reglamento establecimientos de salud |
| Ley N 27269 | Firmas y certificados digitales (validez legal sin notario) |
| RM N 1041-2006/MINSA | Lineamientos personal tecnico y auxiliar |

---

> **Disclaimer:** Este documento tiene caracter informativo y estrategico.
> No constituye asesoria legal formal. Consultar con abogado colegiado
> especializado en derecho de salud antes de implementar cambios regulatorios.
