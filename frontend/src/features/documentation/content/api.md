# Endpoints y ejemplos

La integración externa debe ejecutarse desde un backend, worker o servicio controlado. El navegador del usuario final no debe conocer la API key.

## Base URL

| Entorno | URL |
| --- | --- |
| Desarrollo local directo | `http://localhost:4000/api` |
| Desarrollo usando el frontend | `http://localhost:5173/api` |
| Producción | `https://dominio.com/api` |

En producción, frontend y backend deben operar bajo el mismo dominio o detrás del mismo proxy. La integración externa solo necesita la URL pública de API.

## Listar plantillas

```http
GET /api/v1/templates
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
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
      "name": "Certificado Nutrición",
      "code": "certificado_nutricion_a9d8a3d7",
      "status": "DRAFT",
      "versionNumber": 1,
      "pageFormat": "A4",
      "pageOrientation": "LANDSCAPE",
      "pageWidthMm": 297,
      "pageHeightMm": 210,
      "tags": ["certificados"]
    }
  ]
}
```

## Solicitar render

```http
POST /api/v1/render
content-type: application/json
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

```json
{
  "templateCode": "certificado_nutricion_a9d8a3d7",
  "input": {
    "nombre_completo": "María Pérez Ramos",
    "tipo_documento": "DNI",
    "nro_documento": "11223344",
    "horas": "64",
    "fecha_emision": "30 de septiembre del 2025"
  }
}
```

Ejemplo con `curl`:

```bash
curl -sS -X POST "https://dominio.com/api/v1/render" \
  -H "content-type: application/json" \
  -H "x-api-key: $PDFME_API_KEY" \
  -d '{
    "templateCode": "certificado_nutricion_a9d8a3d7",
    "input": {
      "nombre_completo": "María Pérez Ramos",
      "tipo_documento": "DNI",
      "nro_documento": "11223344",
      "horas": "64"
    }
  }' \
  --output certificado.pdf
```

Estado actual del backend:

| Endpoint | Autenticación | Implementación |
| --- | --- | --- |
| `GET /api/v1/templates` | Activa | Lista catálogo. |
| `POST /api/v1/render` | Activa | Genera el PDF usando la versión actual de la plantilla. |

## Cliente TypeScript

```ts
type PdfServerTemplate = {
  code: string;
  name: string;
  status: string;
  versionNumber: number;
  pageFormat: string;
  pageOrientation: 'PORTRAIT' | 'LANDSCAPE';
};

type RenderInput = Record<string, string | number | boolean | null>;

class PdfServerClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async listTemplates(): Promise<PdfServerTemplate[]> {
    const response = await fetch(`${this.baseUrl}/v1/templates`, {
      headers: { 'x-api-key': this.apiKey },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? `PDF Server respondió ${response.status}`);
    }

    return payload.data;
  }

  async render(templateCode: string, input: RenderInput): Promise<ArrayBuffer> {
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

## Patrón backend recomendado

| Paso | Acción |
| --- | --- |
| 1 | Guardar `PDFME_API_URL` y `PDFME_API_KEY` como variables de entorno. |
| 2 | Consultar el catálogo durante configuración o sincronización. |
| 3 | Guardar el `templateCode` seleccionado en el sistema consumidor. |
| 4 | Construir `input` desde datos propios ya validados. |
| 5 | Llamar a render desde backend, nunca desde JavaScript público. |
| 6 | Registrar status HTTP, `templateCode` y correlación interna del request. |

## Validación previa

| Validación | Motivo |
| --- | --- |
| `templateCode` existe en catálogo. | Evita errores por códigos antiguos o mal copiados. |
| `input` contiene variables requeridas. | Evita documentos incompletos. |
| Fechas ya están localizadas. | Mantiene consistencia visual y legal. |
| Números se envían como texto si deben imprimirse. | Evita separadores o decimales inesperados. |
| Nombres largos fueron probados. | Reduce cortes visuales en certificados. |
