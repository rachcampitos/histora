# 🧪 Resolución de conflictos en pruebas e2e con Jest, TypeScript y MongoDB en memoria

Este documento registra los errores encontrados durante el setup de pruebas e2e, junto con sus causas, soluciones aplicadas y buenas prácticas. Sirve como referencia técnica para evitar errores recurrentes y facilitar el mantenimiento del entorno de testing.

---

## 📁 Archivo clave: `test/setup.ts`

### Propósito
Inicializa entorno de pruebas con MongoDB en memoria y carga variables de entorno desde `.env`.

### Setup aplicado

```ts
import * as dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

let mongoServer: MongoMemoryServer;

export async function setupMongoMemory() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL = mongoServer.getUri();
}

export async function teardownMongoMemory() {
  await mongoServer.stop();
}

🐞 Errores encontrados y soluciones

1. Top-level `await` no permitido

• Síntoma: SyntaxError: await is only valid in async functions...
• Causa: TypeScript no permite await fuera de funciones si module no está configurado correctamente.
• Solución:
• Encapsular en función async.
• Ajustar tsconfig.json:
```json
            {
            "target": "ES2023",
            "module": "nodenext",
            "isolatedModules": true
            }
```

2. `ConnectionStates` undefined

• Síntoma: TypeError: Cannot read properties of undefined (reading 'connected')
• Causa: ConnectionStates no es exportado públicamente por mongoose.
• Solución: Definir enum local:
```ts
    enum ConnectionStates {
    disconnected = 0,
    connected = 1,
    connecting = 2,
    disconnecting = 3,
    uninitialized = 99,
    }
```
3. Jest no encuentra `setup.ts`

• Síntoma: Module ./test/setup.ts in the setupFiles option was not found
• Causa: rootDir mal configurado en jest-e2e.json.
• Solución:
• Mover jest-e2e.json a la raíz del proyecto.
• Configurar correctamente:
```json
{
  "rootDir": ".",
  "setupFiles": ["./test/setup.ts"]
}
```
## 🧩 Error: Nest can't resolve dependencies of the Controller

**Fecha:** 2025-09-03  
**Archivo afectado:** `clinical-history.controller.spec.ts`  
**Síntoma:**  
Al ejecutar los tests, aparece el siguiente error:

Nest can’t resolve dependencies of the ClinicalHistoryController (?). Please make sure that the argument ClinicalHistoryService at index [0] is available in the RootTestModule context.
**Causa raíz:**  
Se estaba revisando y editando el archivo `clinical-history.service.spec.ts`, que no presentaba errores, en lugar del archivo correcto `clinical-history.controller.spec.ts`, donde faltaba registrar el `ClinicalHistoryService` como proveedor en el módulo de prueba.

**Solución aplicada:**  
Corregir el archivo objetivo y registrar correctamente las dependencias:

```ts
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [ClinicalHistoryController],
    providers: [
      ClinicalHistoryService,
      {
        provide: getModelToken(ClinicalHistory.name),
        useValue: {},
      },
      {
        provide: getModelToken(Patient.name),
        useValue: {},
      },
      {
        provide: getModelToken(Doctor.name),
        useValue: {},
      },
    ],
  }).compile();

  controller = module.get<ClinicalHistoryController>(ClinicalHistoryController);
});
```
Lección aprendida:
Verificar siempre que el archivo de test que se está editando corresponde al error reportado. En tests de controladores, asegurarse de registrar el servicio y sus dependencias (modelos, servicios externos, etc.) en providers.

Estado: ✅ Resuelto




