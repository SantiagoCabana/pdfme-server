# API externa

La API se publica bajo el mismo dominio de la aplicación. En producción usa una URL como `https://dominio.com/api`; en desarrollo, Vite redirige `/api` al backend local.

## Autenticación

Los endpoints públicos `v1` requieren la clave en el header:

```http
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

No envíes la clave en query params ni la incluyas en código frontend público.

## Listar plantillas

```http
GET /api/v1/templates
```

```bash
curl "https://dominio.com/api/v1/templates" \
  -H "x-api-key: $PDFME_API_KEY"
```

Respuesta `200`:

```json
{
  "data": [
    {
      "id": "cmrpcj5y2000lhzhjmk1w81dp",
      "name": "C1 Docencia en Salud",
      "code": "c1_docencia_en_salud_a9d8a3d7",
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

El objeto real también incluye versiones, fechas, cantidad de páginas y estado de publicación.

## Ejemplo TypeScript

```ts
const response = await fetch('https://dominio.com/api/v1/templates', {
  headers: { 'x-api-key': process.env.PDFME_API_KEY ?? '' },
});

const payload = await response.json();
if (!response.ok) throw new Error(payload.message ?? `HTTP ${response.status}`);

console.log(payload.data);
```

## Solicitar render

```http
POST /api/v1/render
```

```bash
curl -X POST "https://dominio.com/api/v1/render" \
  -H "content-type: application/json" \
  -H "x-api-key: $PDFME_API_KEY" \
  -d '{
    "templateCode": "c1_docencia_en_salud_a9d8a3d7",
    "input": {
      "nombre_completo": "María Pérez Ramos",
      "tipo_documento": "DNI",
      "nro_documento": "11223344",
      "horas": "64"
    }
  }'
```

> Estado actual: el endpoint valida la API key, pero responde `501`. El generador final todavía no está conectado a la versión actual de la plantilla.

## Crear una clave

En la aplicación abre **Claves API** y define:

- nombre descriptivo
- fecha de expiración opcional
- orígenes permitidos opcionales

La respuesta de creación contiene `rawKey` una sola vez. Las consultas posteriores muestran únicamente el prefijo y los metadatos de la credencial.
