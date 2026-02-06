# API del Colegio de Enfermeros del Peru (CEP)

## Base URL
```
https://www.cep.org.pe/validar/
```

## Endpoints

### 1. Buscar por nombre (Typeahead)
**Endpoint:** `GET /comun/json_personas.php`

**Parametros:**
- `query`: Texto de busqueda (minimo 3 caracteres)

**Ejemplo:**
```bash
curl -sk "https://www.cep.org.pe/validar/comun/json_personas.php?query=CHAVEZ"
```

**Respuesta:**
```json
[
  {
    "c_cmp": "108887",
    "nombre": "[108887 ] CHAVEZ TORRES MARIA CLAUDIA"
  }
]
```

### 2. Validar CEP (Obtener datos completos)
**Endpoint:** `POST /pagina/view.php`

**Headers:**
- `Content-Type: application/x-www-form-urlencoded`
- `Referer: https://www.cep.org.pe/validar/`

**Body:**
- `cep`: Numero de CEP (6 digitos)
- `token`: Token de sesion (obtener de la pagina principal)

**Obtener Token:**
```bash
curl -sk "https://www.cep.org.pe/validar/" | grep 'name="token"'
# Retorna: <input type="hidden" name="token" value="BASE64_TOKEN">
```

**Ejemplo de validacion:**
```bash
TOKEN="UVpRZ0s1ZHFtQWlhYmpoNk5rWXl6aFRHOEozUEtiRWt6OEhTWWFkNWlkST0="
curl -sk -X POST "https://www.cep.org.pe/validar/pagina/view.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Referer: https://www.cep.org.pe/validar/" \
  -d "cep=108887&token=$TOKEN"
```

**Respuesta HTML (parsear):**
```html
<img src="https://www.cep.org.pe/fotos/44119536.jpg" ... />
<h4 class="card-title mt-2"><strong>CHAVEZ TORRES MARIA CLAUDIA</strong></h4>
<h6 class="card-subtitle">CONSEJO REGIONAL III LIMA METROPOLITANA</h6>
<div class="alert alert-success" role="alert">
    <strong><i class="fa fa-check"></i> HABIL</strong>
</div>
```

### 3. Verificar foto por DNI
**Endpoint:** `GET /fotos/{DNI}.jpg`

**Ejemplo:**
```bash
curl -sI "https://www.cep.org.pe/fotos/44119536.jpg"
# 200 = Foto existe (enfermera registrada)
# 404 = No existe
```

## Datos que se pueden extraer

| Campo | Selector/Patron | Ejemplo |
|-------|-----------------|---------|
| Foto URL | `<img src="...">` | `https://www.cep.org.pe/fotos/44119536.jpg` |
| Nombre Completo | `<h4 class="card-title">` | `CHAVEZ TORRES MARIA CLAUDIA` |
| Consejo Regional | `<h6 class="card-subtitle">` | `CONSEJO REGIONAL III LIMA METROPOLITANA` |
| Estado | `<div class="alert alert-success/danger">` | `HABIL` o `INHABILITADO` |

## Estados posibles

| Estado | Clase CSS | Descripcion |
|--------|-----------|-------------|
| HABIL | `alert-success` | Enfermera habilitada para ejercer |
| INHABILITADO | `alert-danger` | Enfermera NO habilitada |

## Flujo de validacion recomendado

```
1. Usuario ingresa: CEP + DNI
          |
          v
2. Obtener token de sesion
   GET /validar/ -> extraer token
          |
          v
3. Validar CEP con view.php
   POST /pagina/view.php {cep, token}
          |
          v
4. Parsear respuesta HTML:
   - Nombre completo
   - Consejo regional
   - Estado (HABIL/INHABILITADO)
   - DNI de la foto URL
          |
          v
5. Verificar que DNI de foto == DNI ingresado
          |
          v
6. Si HABIL y DNIs coinciden -> VALIDO
```

## Notas importantes

1. **SSL**: El sitio tiene problemas de certificado, usar `rejectUnauthorized: false`
2. **Token**: El token es obligatorio y cambia periodicamente
3. **Rate limiting**: No documentado, usar con moderacion
4. **Foto default**: Si no hay foto, redirige a `sinfoto.jpg`

## Ejemplo de implementacion (Node.js)

```typescript
async function validateCepComplete(cepNumber: string): Promise<CepValidationResult> {
  // 1. Obtener token
  const pageResponse = await axios.get('https://www.cep.org.pe/validar/');
  const tokenMatch = pageResponse.data.match(/name="token" value="([^"]+)"/);
  const token = tokenMatch ? tokenMatch[1] : '';

  // 2. Validar CEP
  const response = await axios.post(
    'https://www.cep.org.pe/validar/pagina/view.php',
    `cep=${cepNumber}&token=${token}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.cep.org.pe/validar/'
      }
    }
  );

  // 3. Parsear HTML
  const html = response.data;
  const photoMatch = html.match(/src="(https:\/\/www\.cep\.org\.pe\/fotos\/(\d+)\.jpg)"/);
  const nameMatch = html.match(/<h4 class="card-title[^"]*"><strong>([^<]+)<\/strong>/);
  const regionMatch = html.match(/<h6 class="card-subtitle">([^<]+)<\/h6>/);
  const isHabil = html.includes('alert-success') && html.includes('HABIL');

  return {
    isValid: !!photoMatch,
    data: {
      photoUrl: photoMatch?.[1],
      dni: photoMatch?.[2],
      fullName: nameMatch?.[1]?.trim(),
      region: regionMatch?.[1]?.trim(),
      isHabil,
      status: isHabil ? 'HABIL' : 'INHABILITADO'
    }
  };
}
```

---
Documentado: 2026-01-15
Probado con CEP: 108887, DNI: 44119536
