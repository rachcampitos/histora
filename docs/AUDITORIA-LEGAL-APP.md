# Auditoria Legal - NurseLite App (Paginas Legales)

> Fecha: 2026-02-18 (actualizado)
> Status: ERRORES CRITICOS CORREGIDOS
> Archivos auditados: terms.page.ts, privacy.page.ts, help.page.ts
> Empresa: Code Media EIRL (RUC 20615496074, constituida 10/02/2026)

---

## RESUMEN EJECUTIVO

Se encontraron **7 problemas criticos** que deben corregirse antes de lanzar, **6 mejoras importantes** para los primeros 30 dias, y **3 mejoras deseables** a futuro. Los problemas mas graves son: razon social incorrecta (dice SAC, es EIRL), falsa declaracion de registro ANPDP, y clausula de exencion total de responsabilidad que podria ser declarada abusiva por INDECOPI.

---

## 1. ERRORES CRITICOS (Corregir antes de lanzar)

### 1.1 Razon social incorrecta

**Ubicacion:** Politica de Privacidad, seccion 2
**Problema:** Dice "NurseLite S.A.C." pero la empresa real es "Code Media EIRL"
**Riesgo:** Informacion falsa al consumidor (Ley 29571, Art. 19)

**Correccion:**
```
Reemplazar en TODOS los documentos:
"NurseLite S.A.C." → "Code Media EIRL"

Seccion 2 completa corregida:
"2. Responsable del Tratamiento

Code Media Empresa Individual de Responsabilidad Limitada (Code Media EIRL),
con nombre comercial 'NurseLite':

- Razon Social: Code Media EIRL
- RUC: [Actualizar post-constitucion]
- Domicilio Fiscal: [Actualizar post-constitucion]
- Actividad Economica: Desarrollo de software e intermediacion tecnologica
- Representante Legal: [Nombre del titular]
- Correo de Privacidad: privacidad@nurselite.pe"
```

### 1.2 Falsa declaracion de registro ANPDP

**Ubicacion:** Politica de Privacidad, seccion 2
**Problema:** Dice "Contamos con un banco de datos personales registrado ante la Autoridad Nacional de Proteccion de Datos Personales" - esto es FALSO, no esta registrado
**Riesgo:** Sancion INDECOPI por informacion falsa (multas 0.5-50 UIT = S/2,500-250,000)

**Correccion:**
```
Reemplazar por:
"El registro del banco de datos personales ante la Autoridad Nacional de
Proteccion de Datos Personales se encuentra en tramite conforme a la
Ley N 29733."
```

**Accion adicional:** Iniciar tramite real de registro ANPDP dentro de los primeros 30 dias post-constitucion.

### 1.3 Clausula de exencion total de responsabilidad (abusiva)

**Ubicacion:** Terminos y Condiciones, seccion 7
**Problema:** Dice "NurseLite no sera responsable por danos derivados de la prestacion de servicios de salud" - clausula de exencion total puede ser declarada ABUSIVA (Ley 29571, Art. 49-50)
**Riesgo:** INDECOPI puede anular la clausula y sancionar

**Correccion - Reescribir seccion 7 completa:**
```
"7. Responsabilidades y Limitaciones

7.1 Naturaleza de la Relacion
NurseLite actua exclusivamente como plataforma tecnologica de intermediacion.
Los servicios de enfermeria son prestados de manera independiente por
profesionales licenciados con quienes NurseLite no mantiene relacion laboral.

7.2 Responsabilidad de NurseLite
Como plataforma, NurseLite es responsable de:
- Verificar la vigencia de la colegiatura CEP al momento del registro
- Garantizar la operatividad de la plataforma tecnologica
- Procesar pagos de manera segura
- Atender reclamos en un plazo maximo de 15 dias habiles

7.3 Limitacion de Responsabilidad por Actos de Terceros
NurseLite NO es responsable por:
- Decisiones clinicas, diagnosticos o tratamientos realizados por los profesionales
- Complicaciones medicas derivadas de condiciones preexistentes del paciente
- Danos causados por negligencia profesional del enfermero(a), sin perjuicio del
  derecho del usuario de reclamar directamente al profesional responsable

7.4 Responsabilidad Maxima
En caso de fallas en la plataforma tecnologica atribuibles a NurseLite,
la responsabilidad maxima sera equivalente al monto total de las comisiones
cobradas al usuario en los ultimos 12 meses.

7.5 Obligacion de Informacion
NurseLite facilitara la identificacion del profesional responsable y cooperara
con autoridades competentes (SUSALUD, Colegio de Enfermeros del Peru, Fiscalia)
en caso de investigaciones."
```

### 1.4 Falta procedimiento de Libro de Reclamaciones

**Ubicacion:** Terminos y Condiciones, seccion 12 (solo lo menciona, no lo detalla)
**Problema:** El Libro de Reclamaciones es OBLIGATORIO (D.S. 011-2011-PCM, Ley 29571 Art. 25) y debe tener procedimiento formal
**Riesgo:** Sancion INDECOPI por incumplimiento

**Correccion - Agregar al final de seccion 12:**
```
"12.2 Libro de Reclamaciones Virtual

Conforme al Codigo de Proteccion al Consumidor, NurseLite pone a disposicion
un Libro de Reclamaciones Virtual accesible en:

a) Aplicacion movil: Configuracion > Ayuda > Libro de Reclamaciones
b) Sitio web: www.nurse-lite.com/libro-reclamaciones
c) Correo: reclamaciones@nurselite.pe (asunto: 'LIBRO DE RECLAMACIONES')

Procedimiento:
1. Usuario completa formulario con detalle del reclamo o queja
2. Recibe codigo de seguimiento automatico
3. NurseLite responde en maximo 15 dias habiles
4. Si no hay solucion, se deriva copia a INDECOPI

Diferencia Reclamo vs Queja:
- RECLAMO: Disconformidad por servicio defectuoso (ej: profesional no llego, cobro indebido)
- QUEJA: Disconformidad por atencion al usuario (ej: demora en responder soporte)

El acceso al Libro de Reclamaciones es GRATUITO."
```

### 1.5 Falta seccion de Derechos del Paciente (Ley 29414)

**Ubicacion:** Terminos y Condiciones - NO EXISTE
**Problema:** La Ley 29414 exige que se informen los derechos del paciente
**Riesgo:** Sancion SUSALUD, demandas de usuarios

**Correccion - Agregar nueva seccion despues de seccion 6:**
```
"6-A. Derechos de los Pacientes Usuarios

Conforme a la Ley N 29414 (Derechos de los Usuarios de Servicios de Salud),
los pacientes que contratan servicios a traves de NurseLite tienen derecho a:

a) Recibir informacion completa sobre el profesional (nombre, numero CEP, especialidad)
b) Otorgar o denegar consentimiento informado antes de cualquier procedimiento
c) Acceso a informacion sobre costos antes de contratar el servicio
d) Confidencialidad de su informacion medica
e) Presentar reclamos ante SUSALUD por deficiencias en la calidad del servicio
f) Solicitar copia de cualquier registro o reporte elaborado por el profesional

NurseLite garantiza el acceso a estos derechos facilitando:
- Perfil verificado del profesional antes de la contratacion
- Canal de reclamos en soporte@nurselite.pe
- Acceso al Libro de Reclamaciones virtual
- Cooperacion con investigaciones de SUSALUD o el Colegio de Enfermeros del Peru"
```

### 1.6 Falta aclaracion regulatoria de intermediario

**Ubicacion:** Terminos y Condiciones, seccion 1
**Problema:** Dice que es intermediario pero no refuerza suficiente la distincion con prestador de salud
**Riesgo:** SUSALUD o tribunales podrian considerar a NurseLite como prestador directo

**Correccion - Agregar despues de seccion 1:**
```
"1-A. Aclaracion Regulatoria

Code Media EIRL (NurseLite) NO es:
- Establecimiento de salud (clinica, hospital, centro medico)
- Prestador directo de servicios de enfermeria
- Empleador de los profesionales registrados
- Responsable de decisiones clinicas o diagnosticos

Code Media EIRL (NurseLite) SI es:
- Plataforma tecnologica de intermediacion
- Facilitador del contacto entre pacientes y profesionales independientes
- Procesador de pagos por cuenta de las partes
- Verificador de credenciales CEP al momento del registro

Los servicios de enfermeria son prestados por profesionales independientes
licenciados que utilizan la plataforma para conectar con pacientes.
Cada profesional es responsable de:
- Mantener vigente su colegiatura CEP
- Cumplir protocolos y estandares del Colegio de Enfermeros del Peru
- Responder por negligencia o mala praxis segun normativa profesional

Regulacion aplicable:
- NurseLite (plataforma digital): Ley 29571 (Proteccion al Consumidor), Ley 29733 (Datos Personales)
- Profesionales de enfermeria: Ley 27669 (Trabajo de la Enfermera/o), Codigo de Etica del CEP
- Relacion terapeutica: Ley 26842 (Ley General de Salud), Ley 29414 (Derechos del Usuario)"
```

### 1.7 Datos placeholder sin completar

**Ubicaciones multiples:**

| Dato | Ubicacion | Valor actual | Que poner |
|------|-----------|-------------|-----------|
| RUC | Privacidad seccion 2 | [Pendiente de registro] | RUC real post-constitucion |
| Domicilio fiscal | Privacidad seccion 2 | "Lima, Peru" (incompleto) | Direccion completa |
| Telefono | Terminos seccion 12 | +51 1 XXX-XXXX | Numero real o WhatsApp Business |
| Telefono | Privacidad seccion 14 | +51 1 XXX-XXXX | Numero real |
| WhatsApp | Help - General | +51 XXX XXX XXX | Numero WhatsApp Business |
| Representante legal | No aparece | - | Nombre del titular EIRL |

**Solucion temporal (pre-constitucion):**
- RUC: "En proceso de inscripcion registral"
- Domicilio: "Se comunicara una vez completada la inscripcion"
- Telefono: Usar celular personal con WhatsApp Business
- Post-constitucion: Actualizar todo en maximo 48 horas

---

## 2. MEJORAS IMPORTANTES (Primeros 30 dias)

### 2.1 Protocolo de emergencias medicas

**Faltante en:** Terminos y Condiciones
**Razon:** Si ocurre una emergencia durante el servicio, debe haber protocolo claro

**Contenido sugerido:**
```
"Protocolo de Emergencias Medicas

Definicion: Situacion que pone en riesgo inminente la vida o salud del paciente.

Obligacion del Profesional en emergencia:
a) Brindar primeros auxilios inmediatos
b) Llamar al 106 (SAMU) o 116 (Bomberos)
c) Notificar a familiares del paciente
d) Permanecer con el paciente hasta llegada de servicios de emergencia
e) Reportar incidente a NurseLite dentro de las 2 horas siguientes

Obligacion de NurseLite:
- Boton de emergencia visible en la app (llamada directa a 106)
- Notificacion automatica al contacto de emergencia registrado
- Cooperacion con autoridades de salud
- No penalizar al profesional por costos de emergencia"
```

### 2.2 Consentimiento informado para procedimientos

**Faltante en:** Terminos y Condiciones, seccion 3
**Razon:** Ley 26842 Art. 4 y Ley 29414 Art. 10 lo exigen

**Contenido sugerido:**
```
"Para procedimientos invasivos o de mayor complejidad (ej: caterizacion,
curaciones complejas, administracion de medicamentos endovenosos), el
profesional debe:

a) Explicar verbalmente el procedimiento, riesgos y alternativas
b) Obtener consentimiento del paciente o familiar responsable
c) Documentar el consentimiento en las notas del servicio

El paciente tiene derecho a denegar cualquier procedimiento sin penalizacion."
```

### 2.3 Seccion ampliada de menores de edad

**Ubicacion:** Politica de Privacidad, seccion 12
**Problema:** Muy superficial, falta detalle sobre datos de menores

**Agregar:**
- Solo se recopilara nombre, edad, y datos del responsable
- Datos de salud del menor con proteccion reforzada
- Adulto puede ejercer derechos ARCO sobre datos del menor
- Al cumplir 18, la persona puede solicitar transferencia de titularidad

### 2.4 Codigo de conducta para profesionales

**Faltante en:** Terminos y Condiciones, seccion 6
**Beneficio:** Reduce riesgos y refuerza imagen profesional

**Contenido clave:**
```
Antes del servicio:
- Confirmar disponibilidad real antes de aceptar
- Llegar puntualmente (max 15 min tolerancia)
- Presentarse con identificacion CEP visible

Durante el servicio:
- Identificarse ante paciente/familiar
- Explicar procedimientos en lenguaje comprensible
- Usar equipo de proteccion personal
- Documentar procedimientos en la app

Prohibiciones:
- Solicitar contacto del paciente para servicios fuera de la plataforma
- Realizar procedimientos fuera de competencia profesional
- Atender bajo efectos de alcohol o sustancias
- Tomar fotografias sin consentimiento
- Discutir honorarios diferentes a los pactados

Sanciones:
- 1ra infraccion leve: Advertencia
- 2da infraccion o 1ra grave: Suspension 30 dias
- 3ra infraccion o 1ra muy grave: Suspension definitiva + reporte al CEP
- Derecho a defensa: 5 dias habiles para descargos
```

### 2.5 Transparencia de algoritmos

**Faltante en:** Politica de Privacidad
**Razon:** Ley 29733 Art. 13 - derecho a no ser objeto de decision puramente automatizada

**Contenido sugerido:**
```
"Uso de Algoritmos

NurseLite utiliza algoritmos para:
- Ordenar resultados de busqueda (por distancia, calificacion, disponibilidad)
- Recomendar profesionales segun historial
- Detectar actividad fraudulenta

El usuario puede solicitar revision humana de decisiones automatizadas
escribiendo a privacidad@nurselite.pe"
```

### 2.6 Procedimiento de reclamos en cancelaciones

**Ubicacion:** Terminos y Condiciones, seccion 5
**Faltante:** No dice que hacer si el usuario no esta conforme con la politica de cancelacion

**Agregar:**
```
"Si no esta conforme con la aplicacion de esta politica:
a) Presentar reclamo a soporte@nurselite.pe con asunto 'RECLAMO'
b) NurseLite responde en maximo 15 dias habiles
c) Si persiste desacuerdo, acudir a INDECOPI o SUSALUD
d) Libro de Reclamaciones disponible en la app"
```

---

## 3. MEJORAS DESEABLES (Primeros 6 meses)

### 3.1 Clausula de arbitraje voluntario

- Alternativa a litigio judicial (mas rapido y economico)
- DEBE ser opcional para el consumidor (si es obligatorio, INDECOPI lo declara abusivo)
- Opciones: Camara de Comercio de Lima o Centro de Arbitraje INDECOPI

### 3.2 Seguro de Responsabilidad Civil

- No obligatorio para plataformas, pero muy recomendable
- RC Plataforma: S/3,000-8,000/ano (errores verificacion, fallas tech)
- RC Individual enfermeras: S/800-2,000/ano por enfermera
- Evaluar a partir de 1,000 servicios completados

### 3.3 Revision con abogado especializado

- 2-3 horas consultoria con abogado de Derecho de Salud
- Validar clausulas de responsabilidad
- Revisar cumplimiento Ley 29571 (clausulas abusivas)
- Costo estimado: S/500-1,000

---

## 4. TRAMITES ADMINISTRATIVOS PENDIENTES

| Tramite | Obligatorio? | Plazo | Costo | Estado |
|---------|-------------|-------|-------|--------|
| Constitucion Code Media EIRL | SI | Proxima semana | Via Crece BCP | En proceso |
| Registro banco datos ANPDP | SI (Ley 29733 Art. 31) | 30 dias post-constitucion | Gratuito (online) | Pendiente |
| Libro de Reclamaciones virtual | SI (D.S. 011-2011-PCM) | Antes de lanzar | S/0 (desarrollo interno) | Pendiente |
| Registro marca INDECOPI | Recomendado | 90-120 dias | S/534.99 | Pendiente |
| Seguro RC plataforma | Recomendado | Antes de escalar | S/3,000-8,000/ano | Pendiente |

---

## 5. LEYES APLICABLES (Referencia rapida)

| Ley | Que regula | Relevancia para NurseLite |
|-----|-----------|--------------------------|
| Ley 29571 | Proteccion al Consumidor | Clausulas abusivas, Libro Reclamaciones, info veraz |
| Ley 29733 | Proteccion Datos Personales | Banco datos, consentimiento, derechos ARCO |
| D.S. 003-2013-JUS | Reglamento Ley 29733 | Detalle de obligaciones de tratamiento de datos |
| Ley 29414 | Derechos Usuarios Salud | Consentimiento informado, derechos del paciente |
| Ley 26842 | Ley General de Salud | Art. 4, 15 consentimiento. Art. 33 emergencias |
| Ley 27669 | Trabajo de la Enfermera | Autonomia profesional, deberes |
| Ley 29344 | Marco SUSALUD | Supervision calidad servicios salud |
| D.S. 011-2011-PCM | Libro de Reclamaciones | Obligatorio para todo proveedor |
| Ley 27269 | Firmas Digitales | Validez legal sin notario |

---

## 6. BUGS UI ENCONTRADOS

### 6.1 Toolbar sin estilos explicitos (light/dark mode)

**Archivo:** `histora-care/src/app/legal/_legal-shared.scss`
**Problema:** Los toolbars de las 3 paginas legales no tienen estilos propios, dependen solo de globals
**Fix:** Agregar estilos explicitos de toolbar en _legal-shared.scss

**Estilos necesarios:**
- Light: `--background: #ffffff; --color: #1e293b`
- Dark: `--background: #0f172a; --color: #f1f5f9`
- Back button icon: color explicito en ambos modos

---

## 7. CHECKLIST PRE-LANZAMIENTO

### Antes de lanzar (obligatorio):
- [x] Corregir "NurseLite S.A.C." → "Code Media EIRL" en los 3 documentos (corregido 12/02/2026)
- [x] Eliminar/corregir afirmacion falsa de registro ANPDP (corregido 12/02/2026)
- [x] Completar datos placeholder (RUC, domicilio, telefono) post-constitucion (completado 18/02/2026)
- [x] Reescribir seccion 7 de T&C (limitacion de responsabilidad) (reescrito 18/02/2026)
- [x] Agregar procedimiento Libro de Reclamaciones (agregado en T&C seccion 13, 18/02/2026)
- [x] Agregar seccion Derechos del Paciente (Ley 29414) (agregado en T&C seccion 12, 18/02/2026)
- [x] Agregar aclaracion regulatoria de intermediario (integrado en T&C seccion 1, 18/02/2026)
- [x] Implementar Libro de Reclamaciones virtual en la app (modulo complaints backend + frontend, 18/02/2026)
- [x] Fix toolbar dark mode en paginas legales (corregido en _legal-shared.scss, 12/02/2026)

### Primeros 30 dias post-lanzamiento:
- [ ] Agregar protocolo de emergencias medicas
- [ ] Agregar consentimiento informado para procedimientos
- [ ] Ampliar seccion menores de edad
- [ ] Agregar codigo de conducta profesionales
- [ ] Agregar transparencia de algoritmos
- [ ] Agregar procedimiento reclamos en cancelaciones
- [ ] Iniciar tramite registro ANPDP

### Primeros 6 meses:
- [ ] Evaluar clausula arbitraje voluntario
- [ ] Evaluar seguro RC
- [ ] Revision con abogado especializado
- [ ] Registrar marca en INDECOPI

---

> **DISCLAIMER:** Este documento tiene caracter informativo y estrategico.
> No constituye asesoria legal formal. Consultar con abogado colegiado
> especializado en derecho de salud antes de implementar cambios regulatorios.
> Basado en legislacion peruana vigente a febrero 2026.
