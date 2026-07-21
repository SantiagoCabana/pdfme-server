# Endpoints y ejemplos

Todos los endpoints externos usan el prefijo `/api/v1` y requieren el header `x-api-key`.

## Base URL

| Ambiente | Base URL | Ejemplo |
| --- | --- | --- |
| Local backend directo | `http://localhost:4000/api` | `http://localhost:4000/api/v1/templates` |
| Producción | `https://dominio.com/api` | `https://dominio.com/api/v1/render` |

Si usas proxy bajo el mismo dominio, el frontend vive en `https://dominio.com` y la API en `https://dominio.com/api`.

## Autenticación

```http
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

La clave debe guardarse en el backend consumidor. No la envíes desde frontend público.

## Listar plantillas

```http
GET /api/v1/templates
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
      "code": "certificado_nutricion_a9d8a3d7",
      "status": "DRAFT",
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

## Inspeccionar entradas de una plantilla

Usa este endpoint antes de integrar o cuando cambie una plantilla.

```http
GET /api/v1/templates/:code/inputs
```

```bash
curl -sS "https://dominio.com/api/v1/templates/certificado_nutricion_a9d8a3d7/inputs" \
  -H "x-api-key: $PDFME_API_KEY"
```

Respuesta `200`:

```json
{
  "template": {
    "code": "certificado_nutricion_a9d8a3d7",
    "name": "Certificado Nutricion",
    "versionNumber": 3,
    "pageCount": 5
  },
  "inputs": {
    "variables": [
      { "key": "nombre_completo", "schemaNames": ["d1_nombre_completo_alumno"], "pages": [1, 2, 3, 4, 5] },
      { "key": "nro_documento", "schemaNames": ["d1_nro_documento_alumno"], "pages": [1, 2, 3, 4, 5] }
    ],
    "objects": [
      { "key": "qr_alumno", "type": "qrcode", "schemaNames": ["#qr_alumno#1", "#qr_alumno#2"], "pages": [1, 2] }
    ]
  },
  "conventions": {
    "dynamicObjectPrefix": "#",
    "reusableSuffixes": ["#1", "#2", "__p2", "__p3", "__page2", "_p2", "_page2"],
    "supportedDynamicObjectTypes": ["image", "qrcode", "code128", "date", "dateTime", "time"]
  }
}
```

Para construir el payload solo usa `key`. `schemaNames` sirve para soporte interno, no para integraciones.

## Renderizar PDF

```http
POST /api/v1/render
content-type: application/json
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

Body:

```json
{
  "templateCode": "certificado_nutricion_a9d8a3d7",
  "input": {
    "nombre_completo": "Maria Perez Ramos",
    "tipo_documento": "DNI",
    "nro_documento": "11223344",
    "horas": "64",
    "fecha_x_fecha_y": "22 de septiembre al 22 de septiembre del 2024",
    "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
  }
}
```

Ejemplo `curl` para Postman o terminal:

```bash
curl -X POST "https://dominio.com/api/v1/render" \
  -H "content-type: application/json" \
  -H "x-api-key: $PDFME_API_KEY" \
  -d '{
    "templateCode": "certificado_nutricion_a9d8a3d7",
    "input": {
      "nombre_completo": "Maria Perez Ramos",
      "tipo_documento": "DNI",
      "nro_documento": "11223344",
      "horas": "64",
      "fecha_x_fecha_y": "22 de septiembre al 22 de septiembre del 2024",
      "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
    }
  }' \
  --output certificado.pdf
```

Respuesta exitosa:

| Header | Valor |
| --- | --- |
| `content-type` | `application/pdf` |
| `content-disposition` | `attachment; filename="certificado_nutricion_a9d8a3d7-v3.pdf"` |
| `x-template-code` | Código de la plantilla renderizada. |
| `x-template-version` | Versión usada para generar el PDF. |

## Cliente TypeScript

```ts
type TemplateInput = Record<string, string | number | boolean | null>;

class PdfServerClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async getTemplateInputs(templateCode: string) {
    const response = await fetch(`${this.baseUrl}/v1/templates/${templateCode}/inputs`, {
      headers: { 'x-api-key': this.apiKey },
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? `PDF Server respondió ${response.status}`);
    return payload;
  }

  async render(templateCode: string, input: TemplateInput): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/v1/render`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({ templateCode, input }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? `PDF Server respondió ${response.status}`);
    }

    return response.arrayBuffer();
  }
}
```

## Endpoints disponibles

| Endpoint | Método | Respuesta |
| --- | --- | --- |
| `/api/v1/templates` | `GET` | Catálogo de plantillas. |
| `/api/v1/templates/:code/inputs` | `GET` | Variables y objetos cambiables. |
| `/api/v1/render` | `POST` | PDF binario o error JSON. |
