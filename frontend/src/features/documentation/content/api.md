# API externa

La API externa se consume con una clave enviada en el header `x-api-key`.

## Autenticacion

```http
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

Si la clave no existe, esta revocada, deshabilitada, expirada o no permite el origen del request, la API responde `401`.

## Listar plantillas

```http
GET /api/v1/templates
```

### cURL

```bash
curl -X GET "http://localhost:4000/api/v1/templates" \
  -H "x-api-key: pk_live_xxxxxxxxxxxxxxxxx"
```

### Respuesta `200`

```json
{
  "data": [
    {
      "id": "cmrpcj5y2000lhzhjmk1w81dp",
      "name": "C1 Docencia en Salud",
      "code": "c1_docencia_en_salud_a9d8a3d7",
      "thumbnailUrl": null,
      "status": "DRAFT",
      "lastPublishedAt": null,
      "versionNumber": 1,
      "versionId": "cmrpcj5y3000mhzhj01b2c3d4",
      "versions": [
        {
          "id": "cmrpcj5y3000mhzhj01b2c3d4",
          "versionNumber": 1,
          "isCurrent": true,
          "isPublished": false,
          "pageCount": 1,
          "createdAt": "2026-07-17T10:00:00.000Z",
          "updatedAt": "2026-07-17T10:30:00.000Z"
        }
      ],
      "isPublished": false,
      "pageCount": 1,
      "pageFormat": "A4",
      "pageOrientation": "LANDSCAPE",
      "pageWidthMm": 297,
      "pageHeightMm": 210,
      "paddingVerticalMm": 12,
      "paddingHorizontalMm": 12,
      "tags": ["certificados"],
      "createdAt": "2026-07-17T10:00:00.000Z",
      "updatedAt": "2026-07-17T10:30:00.000Z"
    }
  ]
}
```

## Solicitar render

```http
POST /api/v1/render
```

### Body sugerido

Este es el formato recomendado para cuando el generador pdfme quede conectado:

```json
{
  "templateCode": "c1_docencia_en_salud_a9d8a3d7",
  "input": {
    "nombre_completo": "Maria Perez Ramos",
    "tipo_documento": "DNI",
    "nro_documento": "11223344",
    "horas": "64",
    "fecha_x_fecha_y": "22 de septiembre al 22 de septiembre del 2024"
  },
  "options": {
    "format": "pdf"
  }
}
```

### cURL

```bash
curl -X POST "http://localhost:4000/api/v1/render" \
  -H "content-type: application/json" \
  -H "x-api-key: pk_live_xxxxxxxxxxxxxxxxx" \
  -d '{
    "templateCode": "c1_docencia_en_salud_a9d8a3d7",
    "input": {
      "nombre_completo": "Maria Perez Ramos",
      "tipo_documento": "DNI",
      "nro_documento": "11223344"
    }
  }'
```

### Respuesta actual `501`

Actualmente el endpoint existe, valida la API key y devuelve:

```json
{
  "ok": false,
  "message": "Render reservado. Falta conectar pdfme generator al TemplateVersion actual.",
  "received": {
    "templateCode": "c1_docencia_en_salud_a9d8a3d7",
    "input": {
      "nombre_completo": "Maria Perez Ramos",
      "tipo_documento": "DNI",
      "nro_documento": "11223344"
    }
  }
}
```

## Ejemplo JavaScript

```ts
const response = await fetch('http://localhost:4000/api/v1/templates', {
  headers: {
    'x-api-key': process.env.PDFME_API_KEY ?? '',
  },
});

if (!response.ok) {
  throw new Error(`API error ${response.status}`);
}

const payload = await response.json();
console.log(payload.data);
```

## Crear API keys desde la app

Las claves se crean desde **Claves API**. Al crear una clave, el backend devuelve `rawKey` una sola vez:

```json
{
  "ok": true,
  "credential": {
    "id": "cmr_api_key_id",
    "name": "Sistema CRM",
    "prefix": "pk_live",
    "status": "ACTIVE",
    "expiresAt": null,
    "allowedOrigins": ["https://crm.empresa.com"]
  },
  "rawKey": "pk_live_xxxxxxxxxxxxxxxxx"
}
```
