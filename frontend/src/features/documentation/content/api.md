# API e integración

Esta página describe cómo un sistema externo consulta plantillas, descubre su contrato de entradas y genera documentos. Incluye la correspondencia entre cada capacidad configurada en el editor y el valor que debe enviarse en `input`.

## Base URL

Todos los endpoints externos usan el prefijo `/api/v1`.

| Entorno | Base de la API | Endpoint de render |
| --- | --- | --- |
| Backend local directo | `http://localhost:4000/api` | `http://localhost:4000/api/v1/render` |
| Aplicación bajo un dominio | `https://dominio.com/api` | `https://dominio.com/api/v1/render` |
| Producción de ejemplo | `https://pdfme.practis.pe/api` | `https://pdfme.practis.pe/api/v1/render` |

La base debe contener `/api` una sola vez. Si configuras `https://dominio.com/api`, no construyas rutas como `/api/api/v1/render`.

## Autenticación

Todos los endpoints `/api/v1/*` requieren:

```http
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

La API key se crea en **Claves API** por un usuario con permiso `api_keys.manage`. Guarda la `rawKey` en el backend consumidor o en un gestor de secretos; no la expongas en el navegador.

## Endpoints disponibles

| Método | Ruta | Resultado |
| --- | --- | --- |
| `GET` | `/api/v1/templates` | Catálogo de plantillas disponibles. |
| `GET` | `/api/v1/templates/:code/inputs` | Variables y objetos detectados en la versión actual. |
| `POST` | `/api/v1/render` | PDF binario generado con `templateCode` e `input`. |

## Flujo recomendado

1. Consulta el catálogo y selecciona el `code` público.
2. Consulta `/inputs` para conocer las claves esperadas.
3. Construye `input` con variables y objetos cambiables.
4. Ejecuta `/render` y procesa la respuesta como PDF binario.
5. Registra los headers de versión si necesitas auditoría.

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
      "name": "Certificado Nutrición",
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

| Campo | Uso externo |
| --- | --- |
| `code` | Enviarlo como `templateCode`. |
| `name` | Mostrar al usuario o usarlo como referencia legible. |
| `status` | Preferir `ACTIVE` en producción. |
| `versionNumber` | Registrar la versión disponible. |
| `pageFormat` y `pageOrientation` | Validar el documento esperado. |
| `id` | Solo soporte interno; no usarlo como contrato. |

## TemplateCode

`templateCode` es exactamente el campo público `code`. No es el `id`, el nombre visible ni un slug calculado por el consumidor.

```json
{
  "id": "cmrpcj5y2000lhzhjmk1w81dp",
  "name": "Certificado Nutrición",
  "code": "nutricion"
}
```

Request correcto:

```json
{
  "templateCode": "nutricion",
  "input": {}
}
```

## Inspeccionar entradas

```http
GET /api/v1/templates/:code/inputs
x-api-key: API_KEY
```

```bash
curl -sS "https://dominio.com/api/v1/templates/nutricion/inputs" \
  -H "x-api-key: $PDFME_API_KEY"
```

Respuesta:

```json
{
  "template": {
    "code": "nutricion",
    "name": "Certificado Nutrición",
    "versionNumber": 3,
    "pageCount": 5
  },
  "inputs": {
    "variables": [
      {
        "key": "nombre_completo",
        "schemaNames": ["d1_nombre_alumno", "c1_nombre_alumno"],
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

Para construir `input`, usa únicamente cada `key`. `schemaNames` ayuda a ubicar elementos dentro del editor, pero no es necesario para una integración normal.

## Correspondencia entre plantilla e input

| Capacidad en la plantilla | Definición | Valor en `input` |
| --- | --- | --- |
| Texto simple | `{nombre_completo}` | `"nombre_completo": "Juan Pérez"` |
| Varias variables | `{tipo_documento}: {nro_documento}` | Enviar ambas claves. |
| Texto fijo en negrita | `**{nombre_curso}**` en modo Markdown | `"nombre_curso": "Nutrición"` |
| Enlace con código | `[{codigo}](https://dominio/student/{codigo})` | `"codigo": "3541397b0026"` |
| Enlace completo | `[Abrir ficha]({url_ficha})` | `"url_ficha": "https://..."` |
| QR | Nombre `#qr_alumno` | `"qr_alumno": "https://..."` |
| Imagen | Nombre `#logo` | `"logo": "data:image/png;base64,..."` |
| Código 128 | Nombre `#codigo_certificado` | `"codigo_certificado": "CERT-001"` |
| Fecha | Nombre `#fecha_emision` | `"fecha_emision": "2026-07-22"` |
| Fecha redactada | `{fecha_emision_texto}` | `"fecha_emision_texto": "22 de julio de 2026"` |

## Texto simple por API

Plantilla:

```text
Otorgado a {nombre_completo}, identificado con {tipo_documento}: {nro_documento}
```

Input:

```json
{
  "nombre_completo": "Juan Pérez Ramos",
  "tipo_documento": "DNI",
  "nro_documento": "12345678"
}
```

Una misma variable se envía una sola vez. PDF Server aplica el valor a todas las cajas y páginas que la utilicen.

## Markdown controlado por la plantilla

Plantilla en modo `inline-markdown`:

```text
Completó el **{nombre_curso}** con ***{horas} horas académicas***.
```

Input:

```json
{
  "nombre_curso": "Diplomado Internacional en Nutrición",
  "horas": "64"
}
```

Este es el uso recomendado: el diseño controla los estilos y la API solo entrega datos.

## Valores con caracteres Markdown

Los valores de variables se insertan como texto literal, incluso cuando la caja usa Markdown:

```json
{
  "descripcion": "Texto con **asteriscos**"
}
```

Los asteriscos enviados como parte del valor se imprimen; no convierten ese fragmento en negrita. Esto evita que un nombre o dato externo altere el diseño. Define los estilos alrededor de la variable en la plantilla, por ejemplo `**{descripcion}**`.

## Enlace dinámico

Plantilla:

```text
[{codigo_qr_alumno}](https://bd.practissac.com/student/{codigo_qr_alumno})
```

Input:

```json
{
  "codigo_qr_alumno": "3541397b0026"
}
```

Resultado:

| Texto visible | Destino clicable |
| --- | --- |
| `3541397b0026` | `https://bd.practissac.com/student/3541397b0026` |

Cuando una variable está incrustada dentro de una URL mayor, PDF Server codifica el segmento para evitar caracteres inválidos. Si la URL completa llega en una sola variable, usa `[Abrir]({url_ficha})`.

## QR repetido en varias páginas

Plantilla:

```text
Página 1: #qr_alumno#1
Página 2: #qr_alumno#2
Página 3: #qr_alumno__p3
```

Input único:

```json
{
  "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
}
```

El mismo contenido se aplica a todos los objetos cuyo nombre se normaliza a `qr_alumno`.

## Imagen dinámica

Input recomendado:

```json
{
  "logo": "data:image/png;base64,iVBORw0KGgoAAA..."
}
```

También puede usarse una URL accesible para el backend, pero el render dependerá de la red y disponibilidad del servidor remoto. Para documentos críticos, prefiere Data URI.

## Fechas y horas

```json
{
  "fecha_emision": "2026-07-22",
  "fecha_hora_emision": "2026-07-22T15:30:00-05:00",
  "hora_emision": "15:30",
  "fecha_emision_texto": "22 de julio de 2026"
}
```

Los tres primeros valores alimentan objetos `date`, `dateTime` y `time`. El último alimenta una variable de texto y es la opción adecuada cuando el sistema consumidor controla la redacción final.

## Valores faltantes y adicionales

| Caso | Comportamiento |
| --- | --- |
| Falta una variable detectada | `400` con `missingVariables`. |
| Variable con `null` | Se considera faltante. |
| Variable con cadena vacía | Se considera faltante. |
| Falta un objeto `#...` | El objeto conserva su contenido predeterminado o queda según la plantilla. |
| Se envía una clave desconocida | No modifica la plantilla. |
| Se repite una clave en varias páginas | El mismo valor se aplica en todas. |

Todas las variables `{...}` detectadas se validan como requeridas. Consulta `/inputs` antes de renderizar y no envíes valores vacíos.

## Reemplazo directo por nombre interno

Por compatibilidad, el backend puede recibir una propiedad que coincida exactamente con el nombre de un contenedor. No se recomienda como contrato externo porque esos nombres son internos, deben ser únicos y pueden cambiar al duplicar o reorganizar la plantilla.

Usa variables `{clave}` para textos y nombres `#clave` para objetos. Así `/inputs` puede descubrir el contrato y una sola clave puede reutilizarse en varias páginas.

## Renderizar un PDF

```http
POST /api/v1/render
x-api-key: API_KEY
Content-Type: application/json
Accept: application/pdf
```

Request completo:

```json
{
  "templateCode": "nutricion",
  "input": {
    "nombre_completo": "Juan Pérez Ramos",
    "tipo_documento": "DNI",
    "nro_documento": "12345678",
    "nombre_curso": "Diplomado Internacional en Nutrición",
    "horas": "64",
    "codigo_qr_alumno": "3541397b0026",
    "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412",
    "fecha_emision_texto": "22 de julio de 2026"
  }
}
```

Respuesta exitosa:

| Propiedad | Valor |
| --- | --- |
| Estado HTTP | `200 OK` |
| `Content-Type` | `application/pdf` |
| Body | PDF binario directo |
| Base64 | No |
| JSON con URL | No |

Headers útiles:

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="nutricion-v3.pdf"
X-Template-Code: nutricion
X-Template-Version: 3
```

## curl y Postman

```bash
curl -X POST "https://dominio.com/api/v1/render" \
  -H "x-api-key: $PDFME_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/pdf" \
  -d '{
    "templateCode": "nutricion",
    "input": {
      "nombre_completo": "Juan Perez Ramos",
      "tipo_documento": "DNI",
      "nro_documento": "12345678",
      "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
    }
  }' \
  --output certificado.pdf
```

En Postman selecciona **Send and Download**. La respuesta no debe visualizarse como JSON o texto.

## Node.js

```js
import fs from 'node:fs';

const response = await fetch('https://dominio.com/api/v1/render', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.PDFME_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/pdf',
  },
  body: JSON.stringify({
    templateCode: 'nutricion',
    input: {
      nombre_completo: 'Juan Perez Ramos',
      tipo_documento: 'DNI',
      nro_documento: '12345678',
      qr_alumno: 'http://bd.practissac.com/student/CD8b5EB45412',
    },
  }),
});

if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  throw new Error(error.message ?? `PDF Server respondió ${response.status}`);
}

const pdf = Buffer.from(await response.arrayBuffer());
fs.writeFileSync('certificado.pdf', pdf);
```

## Node-RED

Flujo:

```text
Inject o Webhook
  -> Function: construir headers y payload
  -> HTTP Request: recibir buffer
  -> Archivo, correo o Google Drive
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
    tipo_documento: msg.payload.tipo_documento,
    nro_documento: msg.payload.nro_documento,
    qr_alumno: msg.payload.qr_alumno
  }
};

return msg;
```

Configura el nodo HTTP Request para retornar un buffer binario. No conviertas el PDF a texto; usa base64 solo si el siguiente sistema lo exige expresamente.

## Google Drive

El resultado de `/render` se entrega directamente al cliente de Drive:

```text
PDF Server -> Buffer PDF -> Google Drive upload
```

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

## Estados de plantilla

| Estado | Render externo | Uso |
| --- | --- | --- |
| `DRAFT` | Sí, si tiene versión actual válida. | Pruebas controladas. |
| `ACTIVE` | Sí. | Producción. |
| `ARCHIVED` | No; responde como no encontrada. | Retiro de una plantilla. |

El render usa la versión marcada como actual. Registra `X-Template-Version` para conocer qué versión produjo cada archivo.

## Errores principales

| Código | Causa habitual | Acción |
| --- | --- | --- |
| `400` | Payload inválido o variables faltantes. | Validar JSON y consultar `/inputs`. |
| `401` | API key ausente, inválida, expirada o restringida. | Revisar `x-api-key` y estado de la clave. |
| `404` | `templateCode` incorrecto, archivado o sin versión actual. | Consultar el catálogo. |
| `500` | Fallo durante la generación. | Registrar el mensaje y revisar logs si persiste. |
| `502` | El proxy no alcanza al servicio. | Revisar dominio, upstream, puerto y contenedores. |

El detalle operativo y las estrategias de reintento están en **Errores y operación**.

## Contexto público para herramientas

```http
GET /api/mcp/context
```

Este recurso resume endpoints, autenticación y convenciones sin exponer API keys, usuarios, plantillas privadas ni documentos generados. Sirve como contexto de integración para asistentes y herramientas automatizadas; no reemplaza la autenticación de `/api/v1/*`.
