# Sistema de Reviews de Enfermeras

## Descripción

Sistema de calificaciones y comentarios que permite a los pacientes evaluar el servicio recibido de las enfermeras. Las calificaciones se promedian y muestran en el perfil público de cada enfermera.

## Modelo de Datos

### NurseReview Schema

```typescript
{
  nurse: ObjectId,           // Referencia a Nurse
  patient: ObjectId,         // Referencia a User (paciente)
  serviceRequest?: ObjectId, // Referencia a ServiceRequest (opcional)
  rating: number,            // 1-5 estrellas
  comment?: string,          // Comentario opcional (max 1000 chars)
  isVerified: boolean,       // Si viene de un servicio completado
  createdAt: Date,
  updatedAt: Date
}
```

### Índices
```javascript
{ nurse: 1, createdAt: -1 }  // Reviews de enfermera ordenados por fecha
{ nurse: 1, patient: 1 }     // Único: un paciente, un review por enfermera
```

## Endpoints

### 1. Obtener Reviews de una Enfermera (Público)
```http
GET /api/nurses/:nurseId/reviews?page=1&limit=10
```

**Respuesta:**
```json
{
  "reviews": [
    {
      "_id": "...",
      "rating": 5,
      "comment": "Excelente servicio, muy profesional",
      "isVerified": true,
      "createdAt": "2026-01-20T10:00:00Z",
      "patient": {
        "firstName": "María",
        "avatar": "https://..."
      }
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 3,
  "averageRating": 4.8
}
```

### 2. Crear Review (Solo Pacientes Autenticados)
```http
POST /api/nurses/:nurseId/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excelente servicio, muy profesional",
  "serviceRequestId": "..." // Opcional, para reviews verificados
}
```

**Respuesta exitosa (201):**
```json
{
  "_id": "...",
  "rating": 5,
  "comment": "Excelente servicio, muy profesional",
  "isVerified": true,
  "createdAt": "2026-01-20T10:00:00Z"
}
```

**Errores:**
- `401`: No autenticado
- `403`: No es paciente
- `404`: Enfermera no encontrada
- `409`: Ya existe un review de este paciente para esta enfermera

## Reglas de Negocio

### Quién puede dejar review
- Solo usuarios con rol `PATIENT`
- Un paciente solo puede dejar UN review por enfermera
- No se puede editar un review existente (solo crear nuevo si no existe)

### Reviews Verificados
- Un review es `isVerified: true` si:
  - Se proporciona `serviceRequestId` válido
  - El serviceRequest está en estado `completed`
  - El paciente es el mismo que creó la solicitud

### Cálculo de Rating Promedio
```typescript
// Se recalcula cada vez que se agrega/modifica un review
async recalculateNurseRating(nurseId: string) {
  const result = await this.nurseReviewModel.aggregate([
    { $match: { nurse: new Types.ObjectId(nurseId) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const avgRating = result[0]?.avgRating || 0;
  const totalReviews = result[0]?.count || 0;

  await this.nurseModel.findByIdAndUpdate(nurseId, {
    averageRating: Math.round(avgRating * 10) / 10,
    totalReviews
  });
}
```

## Validaciones DTO

```typescript
class CreateNurseReviewDto {
  @IsNumber()
  @Min(1, { message: 'La calificación debe ser al menos 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'El comentario no puede exceder 1000 caracteres' })
  comment?: string;

  @IsOptional()
  @IsMongoId({ message: 'ID de solicitud inválido' })
  serviceRequestId?: string;
}
```

## Archivos Relacionados

### Backend
- `src/nurses/schema/nurse-review.schema.ts` - Schema de MongoDB
- `src/nurses/dto/nurse-review.dto.ts` - DTOs de validación
- `src/nurses/nurses.service.ts` - Métodos de reviews
- `src/nurses/nurses.controller.ts` - Endpoints
- `src/nurses/nurses.module.ts` - Módulo actualizado

### Frontend
- `src/app/nurse/reviews/reviews.page.ts` - Pagina de resenas de enfermera
- `src/app/nurse/reviews/reviews.page.html` - Template con rating summary, filtros, cards
- `src/app/nurse/reviews/reviews.page.scss` - Estilos con dark mode
- `src/app/nurse/reviews/reviews.module.ts` - Modulo NgModule
- `src/app/nurse/reviews/reviews-routing.module.ts` - Routing lazy-loaded
- `src/app/core/utils/nurse-tier.util.ts` - Sistema de niveles (certified/outstanding/experienced/elite)
- `src/app/nurse/dashboard/dashboard.page.ts` - Tier computed + navegacion a resenas
- `src/app/shared/components/review-celebration-modal/` - Modal celebratorio post-resena

## Consideraciones de Seguridad

1. **Autenticación requerida** para crear reviews
2. **Rol verificado** - solo pacientes pueden crear reviews
3. **Límite de un review por enfermera** - previene spam
4. **Sanitización de comentarios** - evitar XSS
5. **Rate limiting** - máximo 10 reviews por hora por usuario

## Métricas

```javascript
// Eventos a trackear
'nurse_review_created': { nurseId, rating, hasComment, isVerified }
'nurse_review_viewed': { nurseId, viewedCount }
'nurse_profile_rating_clicked': { nurseId, currentRating }
```

## Sistema de Niveles (Tiers)

El frontend calcula el nivel de la enfermera basado en sus stats:

| Nivel | Label | Color | Criterio |
|-------|-------|-------|----------|
| certified | Certificada | #94a3b8 (gris) | Base (verificada) |
| outstanding | Destacada | #2d5f8a (azul) | 10+ servicios, 4.0+ rating |
| experienced | Experimentada | #7B68EE (morado) | 30+ servicios, 4.5+ rating, 10+ resenas |
| elite | Elite | #FFD700 (dorado) | 50+ servicios, 4.7+ rating, 20+ resenas |

Utilidad: `histora-care/src/app/core/utils/nurse-tier.util.ts`

## Futuras Mejoras

- [ ] Respuestas de enfermeras a reviews
- [ ] Reportar reviews inapropiados
- [x] Filtrar reviews por rating (implementado en reviews page)
- [ ] Reviews con fotos
- [ ] Incentivos por dejar reviews
