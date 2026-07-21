# Endpoints y ejemplos

Esta seccion documenta el contrato HTTP que debe usar cualquier sistema externo para consultar plantillas y generar PDFs. No necesitas conocer la estructura interna de pdfme ni los IDs de base de datos.

Todos los endpoints externos usan el prefijo `/api/v1` y autentican con `x-api-key`.

## URLs base

| Ambiente | Base URL | Ejemplo render |
| --- | --- | --- |
| Local backend directo | `http://localhost:4000/api` | `http://localhost:4000/api/v1/render` |
| Mismo dominio con proxy | `https://dominio.com/api` | `https://dominio.com/api/v1/render` |
| Produccion | `https://pdfme.practis.pe/api` | `https://pdfme.practis.pe/api/v1/render` |

Si tu frontend ya esta en `https://dominio.com`, la API debe quedar bajo `https://dominio.com/api`. Evita duplicar el prefijo y llamar `/api/api/...`.

## Autenticacion

Envia la clave creada en la app administrativa usando exactamente este header:

```http
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

La clave debe guardarse en el backend consumidor. No la expongas en navegadores, apps moviles sin backend o flujos donde el usuario pueda verla.

## Render completo

```http
POST /api/v1/render
x-api-key: API_KEY
Content-Type: application/json
Accept: application/pdf
```

Request:

```json
{
  "templateCode": "nutricion",
  "input": {
    "nombre_completo": "Juan Perez",
    "nro_documento": "12345678",
    "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
  }
}
```

Respuesta exitosa:

| Propiedad | Valor real |
| --- | --- |
| HTTP status | `200 OK` |
| `Content-Type` | `application/pdf` |
| Body | PDF binario directo |
| Base64 | No retorna base64 |
| JSON con URL | No retorna JSON ni URL |
| Descarga sugerida | Header `Content-Disposition` |

Body exitoso:

```text
(binary PDF)
```

Headers utiles de la respuesta:

| Header | Uso |
| --- | --- |
| `content-type` | Confirma que el body es PDF binario. |
| `content-disposition` | Nombre sugerido del archivo. |
| `x-template-code` | Codigo de la plantilla usada. |
| `x-template-version` | Version usada para generar el PDF. |

## curl para Postman o terminal

```bash
curl -X POST "https://dominio.com/api/v1/render" \
  -H "x-api-key: $PDFME_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/pdf" \
  -d '{
    "templateCode": "nutricion",
    "input": {
      "nombre_completo": "Juan Perez",
      "tipo_documento": "DNI",
      "nro_documento": "12345678",
      "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
    }
  }' \
  --output certificado.pdf
```

Si el archivo `certificado.pdf` abre correctamente, la integracion recibio el PDF binario sin transformarlo.

## TemplateCode

`templateCode` corresponde al campo publico `code` de la plantilla.

| Campo de plantilla | Enviar como `templateCode` | Motivo |
| --- | --- | --- |
| `code` | Si | Es el identificador publico estable. |
| `id` | No | Es interno de base de datos. |
| `name` | No | Es texto visible y puede cambiar. |
| Slug manual | No | Solo sirve si coincide exactamente con `code`. |

Ejemplo de plantilla:

```json
{
  "id": "cmrpcj5y2000lhzhjmk1w81dp",
  "name": "Nutricion",
  "code": "nutricion",
  "status": "ACTIVE"
}
```

Request correcto:

```json
{
  "templateCode": "nutricion",
  "input": {}
}
```

## Estado de plantilla

PDF Server maneja estos estados:

| Estado | Puede renderizar | Uso recomendado |
| --- | --- | --- |
| `DRAFT` | Si, si tiene una version actual valida. | Pruebas internas. |
| `ACTIVE` | Si. | Integraciones productivas. |
| `ARCHIVED` | No. | Plantillas retiradas. |

El endpoint `/api/v1/render` busca la plantilla por `code`, excluye `ARCHIVED` y usa la version actual marcada internamente. Para integraciones estables, consume solo plantillas `ACTIVE`.

## Listar plantillas

```http
GET /api/v1/templates
x-api-key: API_KEY
```

```bash
curl -sS "https://dominio.com/api/v1/templates" \
  -H "x-api-key: $PDFME_API_KEY"
```

Respuesta `200`:

```json
{
  "data": [
    {
      "id": "cmrpcj5y2000lhzhjmk1w81dp",
      "name": "Certificado Nutricion",
      "code": "nutricion",
      "status": "ACTIVE",
      "versionNumber": 3,
      "pageFormat": "A4",
      "pageOrientation": "LANDSCAPE",
      "pageWidthMm": 297,
      "pageHeightMm": 210,
      "tags": ["certificados"]
    }
  ]
}
```

Uso recomendado del resultado:

| Campo | Usar para integracion | Observacion |
| --- | --- | --- |
| `code` | Si | Enviar como `templateCode`. |
| `name` | Si | Mostrar al usuario o registrar en logs. |
| `status` | Si | Preferir `ACTIVE` para produccion. |
| `id` | No como contrato externo | Usar solo para soporte interno. |
| `versionNumber` | Si | Auditar que version genero el PDF. |
| `pageFormat` y `pageOrientation` | Si | Validar expectativas del documento. |

## Inspeccionar inputs dinamicos

Antes de integrar una plantilla, consulta sus entradas detectadas:

```http
GET /api/v1/templates/:code/inputs
x-api-key: API_KEY
```

```bash
curl -sS "https://dominio.com/api/v1/templates/nutricion/inputs" \
  -H "x-api-key: $PDFME_API_KEY"
```

Respuesta esperada:

```json
{
  "template": {
    "code": "nutricion",
    "name": "Certificado Nutricion",
    "versionNumber": 3,
    "pageCount": 5
  },
  "inputs": {
    "variables": [
      {
        "key": "nombre_completo",
        "schemaNames": ["d1_nombre_completo_alumno"],
        "pages": [1, 2, 3, 4, 5]
      }
    ],
    "objects": [
      {
        "key": "qr_alumno",
        "type": "qrcode",
        "schemaNames": ["#qr_alumno#1", "#qr_alumno#2"],
        "pages": [1, 2]
      }
    ]
  },
  "conventions": {
    "dynamicObjectPrefix": "#",
    "reusableSuffixes": ["#1", "#2", "__p2", "__p3", "__page2", "_p2", "_page2"],
    "supportedDynamicObjectTypes": ["image", "qrcode", "code128", "date", "dateTime", "time"]
  }
}
```

Para armar el request solo usa `key`. `schemaNames` existe para soporte tecnico y para ubicar los contenedores dentro del editor.

## Variables y objetos

| Tipo | Como se define en plantilla | Como se envia en `input` |
| --- | --- | --- |
| Texto | `{nombre_completo}` | `"nombre_completo": "Juan Perez"` |
| Documento | `{nro_documento}` | `"nro_documento": "12345678"` |
| QR | `#qr_alumno` | `"qr_alumno": "https://..."` |
| Imagen | `#logo` | `"logo": "data:image/png;base64,..."` |
| Fecha | `#fecha_emision` | `"fecha_emision": "2026-07-21"` |

Convencion recomendada:

```json
{
  "input": {
    "nombre_completo": "Juan Perez",
    "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412",
    "logo": "data:image/png;base64,iVBORw0KGgo...",
    "fecha_emision": "2026-07-21"
  }
}
```

Si una variable de texto aparece en varias hojas, se envia una sola vez y se aplica a todas. Si un objeto dinamico debe repetirse en varias hojas, usa nombres unicos en el editor con el mismo nombre base.

| Hoja | Nombre en editor | Clave enviada |
| --- | --- | --- |
| 1 | `#qr_alumno#1` | `qr_alumno` |
| 2 | `#qr_alumno#2` | `qr_alumno` |
| 3 | `#qr_alumno__p3` | `qr_alumno` |
| 4 | `#qr_alumno__page4` | `qr_alumno` |

## Node.js

```js
import fs from 'node:fs';

const KEY = process.env.PDFME_API_KEY;

const payload = {
  templateCode: 'nutricion',
  input: {
    nombre_completo: 'Juan Perez',
    nro_documento: '12345678',
    qr_alumno: 'http://bd.practissac.com/student/CD8b5EB45412',
  },
};

const response = await fetch('https://dominio.com/api/v1/render', {
  method: 'POST',
  headers: {
    'x-api-key': KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/pdf',
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  throw new Error(error.message ?? `PDF Server respondio ${response.status}`);
}

const buffer = await response.arrayBuffer();
fs.writeFileSync('certificado.pdf', Buffer.from(buffer));
```

## Node-RED

Flujo recomendado:

```text
Inject / Webhook
  -> Function: construir payload y headers
  -> HTTP Request: POST /api/v1/render
  -> Google Drive / File / Email: usar binario PDF
```

Function node:

```js
msg.headers = {
  'x-api-key': env.get('PDFME_API_KEY'),
  'Content-Type': 'application/json',
  'Accept': 'application/pdf'
};

msg.payload = {
  templateCode: 'nutricion',
  input: {
    nombre_completo: msg.payload.nombre_completo,
    nro_documento: msg.payload.nro_documento,
    qr_alumno: msg.payload.qr_alumno
  }
};

return msg;
```

HTTP Request node:

| Opcion | Valor |
| --- | --- |
| Method | `POST` |
| URL | `https://dominio.com/api/v1/render` |
| Return | Binary buffer |
| Headers | Usar `msg.headers` |
| Body | Usar `msg.payload` como JSON |

El resultado del nodo HTTP debe mantenerse como binario. No lo conviertas a texto ni base64 salvo que el siguiente servicio lo exija.

## Google Drive

Concepto de integracion:

```text
PDF Server
  -> binary PDF
  -> Google Drive upload
```

Ejemplo Node.js:

```js
import { Readable } from 'node:stream';

const pdfBuffer = Buffer.from(await response.arrayBuffer());

await drive.files.create({
  requestBody: {
    name: 'certificado.pdf',
    mimeType: 'application/pdf',
  },
  media: {
    mimeType: 'application/pdf',
    body: Readable.from(pdfBuffer),
  },
});
```

## Contexto para IA y MCP

PDF Server expone un contexto publico para asistentes o herramientas que necesitan entender la integracion sin leer codigo interno.

```http
GET /api/mcp/context
```

```bash
curl -sS "https://dominio.com/api/mcp/context"
```

Este endpoint devuelve el proposito de la aplicacion, modelo de autenticacion, endpoints externos, convenciones de variables y objetos dinamicos. No expone plantillas reales, usuarios, claves API ni auditoria.

## Endpoints administrativos de documentacion

Estos endpoints usan la sesion de la app administrativa, no `x-api-key`.

| Endpoint | Metodo | Uso |
| --- | --- | --- |
| `/api/documentation/share` | `GET` | Consulta el enlace publico actual. |
| `/api/documentation/share` | `POST` | Activa el enlace actual y lo devuelve. |
| `/api/documentation/share` | `PATCH` | Activa u oculta el enlace con `{ "enabled": true }`. |
| `/api/documentation/share/reset` | `POST` | Genera un UUID nuevo, activa el enlace y devuelve la URL base. |
| `/api/documentation/share/:uuid` | `GET` | Valida si un enlace publico puede leer documentacion. |
