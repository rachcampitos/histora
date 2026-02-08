# Guia de Escalabilidad y Performance - NurseLite
**Fecha:** 27 de enero de 2026
**Version:** 1.0

---

## 1. Capacidad Actual

### Estimacion de usuarios simultaneos

| Componente | Limite Actual | Cuello de Botella |
|------------|---------------|-------------------|
| Railway (Backend) | ~100-500 req/seg | 1 instancia, RAM limitada |
| MongoDB Atlas | ~500-1000 conexiones | Tier basico |
| Cloudflare Pages (Frontend) | Casi ilimitado | Estatico, CDN global |
| WebSockets | ~1000 conexiones | 1 servidor, memoria |

**Capacidad total estimada:** 200-500 usuarios simultaneos

---

## 2. Herramientas de Medicion de Performance

### 2.1 Frontend - Lighthouse

```bash
# Chrome DevTools > Lighthouse
# O via CLI:
npm install -g lighthouse
lighthouse https://app.nurse-lite.com --view
```

**Metricas clave:**
- **LCP (Largest Contentful Paint):** < 2.5s (bueno)
- **FID (First Input Delay):** < 100ms (bueno)
- **CLS (Cumulative Layout Shift):** < 0.1 (bueno)
- **Performance Score:** > 90 (excelente)

### 2.2 Frontend - Web Vitals

```typescript
// Instalar en el proyecto
npm install web-vitals

// src/main.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

onCLS(console.log);   // Cumulative Layout Shift
onFID(console.log);   // First Input Delay
onLCP(console.log);   // Largest Contentful Paint
onFCP(console.log);   // First Contentful Paint
onTTFB(console.log);  // Time to First Byte
```

### 2.3 Backend - Artillery (Load Testing)

```bash
npm install -g artillery

# Crear archivo de test
cat > load-test.yml << 'EOF'
config:
  target: "https://api.historahealth.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/api/v1/health"
  - name: "Get nurses"
    requests:
      - get:
          url: "/api/v1/nurses/nearby?lat=-12.0464&lng=-77.0428&radius=10"
EOF

# Ejecutar
artillery run load-test.yml
```

### 2.4 Backend - Clinic.js (Profiling)

```bash
npm install -g clinic

# Analizar performance
clinic doctor -- node dist/main.js

# Detectar event loop delays
clinic bubbleprof -- node dist/main.js

# Detectar memory leaks
clinic heapprofiler -- node dist/main.js
```

### 2.5 MongoDB - Explain y Profiling

```javascript
// En MongoDB Compass o shell
db.nurses.find({ isAvailable: true }).explain("executionStats")

// Activar profiler para queries lentas (> 100ms)
db.setProfilingLevel(1, { slowms: 100 })

// Ver queries lentas
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

### 2.6 Monitoreo Continuo

**Railway Dashboard:**
- CPU usage
- Memory usage
- Request latency
- Error rate

**MongoDB Atlas:**
- Connection count
- Operations/second
- Query targeting
- Index usage

---

## 3. Estandares y Benchmarks

### 3.1 Performance Web (Core Web Vitals)

| Metrica | Bueno | Necesita Mejora | Malo |
|---------|-------|-----------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |

### 3.2 API Response Times

| Tipo de Endpoint | Objetivo | Aceptable | Critico |
|------------------|----------|-----------|---------|
| Health check | < 50ms | < 100ms | > 200ms |
| Lectura simple | < 100ms | < 300ms | > 500ms |
| Lectura con joins | < 300ms | < 500ms | > 1s |
| Escritura | < 200ms | < 500ms | > 1s |
| Upload archivos | < 2s | < 5s | > 10s |

### 3.3 Disponibilidad (SLA)

| Tier | Uptime | Downtime/mes |
|------|--------|--------------|
| Basico | 99% | 7.3 horas |
| Estandar | 99.9% | 43 minutos |
| Premium | 99.99% | 4.3 minutos |

---

## 4. Plan de Escalabilidad por Fases

### Fase 1: 0-1,000 usuarios (ACTUAL)

**Infraestructura:**
- 1 instancia Railway
- MongoDB Atlas M0/M10
- Cache in-memory (implementado)
- Rate limiting (implementado)

**Costo estimado:** ~$20-50/mes

**Checklist:**
- [x] Health checks
- [x] Exception filter global
- [x] Rate limiting
- [x] Cache basico
- [x] Logging estructurado
- [ ] Alertas basicas (Slack/Discord)

### Fase 2: 1,000-10,000 usuarios

**Infraestructura:**
```yaml
# railway.toml
[deploy]
  numReplicas = 3
  healthcheckPath = "/api/v1/health/ready"
  healthcheckTimeout = 30
```

**Mejoras necesarias:**

```typescript
// 1. Redis para cache distribuido
// npm install @nestjs/cache-manager cache-manager-redis-store redis

import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: 6379,
      ttl: 300, // 5 minutos
    }),
  ],
})
export class AppModule {}
```

```typescript
// 2. Redis para WebSockets (multiples instancias)
// npm install @socket.io/redis-adapter redis

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Costo estimado:** ~$200-400/mes

**Checklist:**
- [ ] Redis para cache/sessions
- [ ] 2-3 replicas de backend
- [ ] MongoDB Atlas M30
- [ ] CDN para imagenes (Cloudinary ya lo hace)
- [ ] Monitoreo APM (New Relic/Datadog)

### Fase 3: 10,000-100,000 usuarios

**Mejoras necesarias:**

```typescript
// 1. Queue system para tareas pesadas
// npm install @nestjs/bull bull

import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'emails' },
      { name: 'reports' },
    ),
  ],
})
export class AppModule {}

// Processor
@Processor('notifications')
export class NotificationProcessor {
  @Process()
  async handleNotification(job: Job<NotificationData>) {
    await this.notificationService.send(job.data);
  }
}

// Uso
await this.notificationQueue.add('push', {
  userId: '123',
  message: 'Tu enfermera esta en camino',
});
```

```typescript
// 2. Database read replicas
const mongoOptions = {
  readPreference: 'secondaryPreferred', // Lee de replicas
  w: 'majority', // Escribe con confirmacion
};
```

**Costo estimado:** ~$1,000-3,000/mes

**Checklist:**
- [ ] Auto-scaling (5-10 instancias)
- [ ] Queue system (Bull/Redis)
- [ ] MongoDB sharding o read replicas
- [ ] Logs centralizados (ELK/Datadog)
- [ ] Tracing distribuido

### Fase 4: 100,000+ usuarios

**Arquitectura:**
```
                        ┌─────────────┐
                        │   Cloudflare │
                        │     (CDN)    │
                        └──────┬──────┘
                               │
                        ┌──────┴──────┐
                        │Load Balancer│
                        └──────┬──────┘
           ┌───────────────────┼───────────────────┐
           │                   │                   │
     ┌─────┴─────┐       ┌─────┴─────┐       ┌─────┴─────┐
     │  API GW   │       │  API GW   │       │  API GW   │
     │ (Kong)    │       │ (Kong)    │       │ (Kong)    │
     └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
           │                   │                   │
     ┌─────┴─────────────────────────────────────┴─────┐
     │              Kubernetes Cluster                  │
     │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
     │  │Auth Svc │ │Nurse Svc│ │Pay Svc  │  ...      │
     │  └────┬────┘ └────┬────┘ └────┬────┘           │
     └───────┼───────────┼───────────┼─────────────────┘
             │           │           │
     ┌───────┴───────────┴───────────┴───────┐
     │           Message Queue               │
     │           (RabbitMQ/Kafka)            │
     └───────────────────┬───────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
┌────┴────┐        ┌────┴────┐        ┌────┴────┐
│MongoDB  │        │ Redis   │        │ S3/GCS  │
│ Cluster │        │ Cluster │        │ Storage │
└─────────┘        └─────────┘        └─────────┘
```

**Costo estimado:** $5,000+/mes

---

## 5. Optimizaciones Inmediatas Recomendadas

### 5.1 Indices de MongoDB

```javascript
// Ejecutar en MongoDB Atlas
db.nurses.createIndex({ "location": "2dsphere" });
db.nurses.createIndex({ "isAvailable": 1, "verificationStatus": 1 });
db.serviceRequests.createIndex({ "patientId": 1, "status": 1 });
db.serviceRequests.createIndex({ "nurseId": 1, "status": 1 });
db.serviceRequests.createIndex({ "createdAt": -1 });
db.loginAttempts.createIndex({ "identifier": 1 });
db.loginAttempts.createIndex({ "lastAttempt": 1 }, { expireAfterSeconds: 86400 });
```

### 5.2 Compresion de Respuestas

```typescript
// main.ts
import * as compression from 'compression';

app.use(compression());
```

### 5.3 Connection Pooling Optimizado

```typescript
// app.module.ts
MongooseModule.forRoot(process.env.MONGO_URL, {
  maxPoolSize: 50,        // Conexiones maximas
  minPoolSize: 10,        // Conexiones minimas
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}),
```

### 5.4 Lazy Loading en Frontend

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'nurse',
    loadChildren: () => import('./nurse/nurse.module').then(m => m.NurseModule)
  },
  {
    path: 'patient',
    loadChildren: () => import('./patient/patient.module').then(m => m.PatientModule)
  }
];
```

---

## 6. Monitoreo y Alertas

### 6.1 Metricas Clave a Monitorear

| Metrica | Umbral Warning | Umbral Critico |
|---------|----------------|----------------|
| CPU | > 70% | > 90% |
| Memory | > 75% | > 90% |
| Response time P95 | > 500ms | > 1s |
| Error rate | > 1% | > 5% |
| DB connections | > 70% | > 90% |

### 6.2 Configurar Alertas en Railway

```bash
# railway.toml
[healthchecks]
  enabled = true
  path = "/api/v1/health/ready"
  interval = 30
  timeout = 10

[alerts]
  cpu_threshold = 80
  memory_threshold = 85
```

### 6.3 Script de Health Check

```bash
#!/bin/bash
# health-check.sh

HEALTH_URL="https://api.historahealth.com/api/v1/health"
SLACK_WEBHOOK="https://hooks.slack.com/services/xxx"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -ne 200 ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"⚠️ API Health Check Failed! Status: '$response'"}' \
    $SLACK_WEBHOOK
fi
```

---

## 7. Checklist Pre-Produccion

### Seguridad
- [x] HTTPS obligatorio
- [x] Rate limiting
- [x] Input validation
- [x] NoSQL injection protection
- [x] XSS protection
- [x] CORS configurado
- [x] Helmet headers
- [ ] Penetration testing

### Performance
- [x] Gzip compression
- [x] Caching basico
- [ ] CDN para assets estaticos
- [ ] Image optimization
- [ ] Database indices optimizados

### Resiliencia
- [x] Health checks
- [x] Graceful shutdown
- [ ] Circuit breaker pattern
- [ ] Retry con exponential backoff
- [ ] Dead letter queue

### Observabilidad
- [x] Logging estructurado
- [ ] APM (Application Performance Monitoring)
- [ ] Distributed tracing
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring

---

## 8. Recursos Adicionales

### Documentacion
- [Railway Scaling](https://docs.railway.app/reference/scaling)
- [MongoDB Performance](https://www.mongodb.com/docs/manual/administration/analyzing-mongodb-performance/)
- [NestJS Performance](https://docs.nestjs.com/techniques/performance)
- [Web Vitals](https://web.dev/vitals/)

### Herramientas
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Artillery](https://artillery.io/)
- [k6](https://k6.io/) - Load testing
- [Clinic.js](https://clinicjs.org/)

---

**Documento generado por Claude Code**
