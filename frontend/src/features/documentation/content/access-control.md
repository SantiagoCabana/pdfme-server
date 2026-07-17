# Respuestas y errores

Esta seccion resume lo que un usuario o desarrollador debe esperar al consumir la app y la API.

## Codigos principales

| Codigo | Significado | Caso comun |
| --- | --- | --- |
| `200` | Operacion correcta | Listar plantillas |
| `201` | Recurso creado | Crear plantilla o API key desde la app |
| `400` | Datos invalidos | Body con formato incorrecto |
| `401` | API key invalida | Falta `x-api-key` o la clave no pasa validacion |
| `404` | Recurso no encontrado | Plantilla, version o API key inexistente |
| `409` | Conflicto | Codigo de plantilla duplicado |
| `501` | No implementado | Render final todavia reservado |

## Error de API key

```json
{
  "message": "API key invalida."
}
```

Puede ocurrir por:

- header `x-api-key` ausente
- clave incorrecta
- clave revocada
- clave deshabilitada
- clave expirada
- origen no permitido en `allowedOrigins`

## Error al crear plantilla

```json
{
  "message": "Datos invalidos para crear la plantilla."
}
```

El body minimo valido es:

```json
{
  "name": "Certificado Nutricion",
  "code": "certificado_nutricion",
  "tagNames": ["certificados"]
}
```

Reglas:

- `name` minimo 2 caracteres
- `code` minimo 3 caracteres
- `code` solo acepta `a-z`, `0-9` y `_`
- `tagNames` es opcional

## Error por codigo duplicado

```json
{
  "message": "No se pudo crear la plantilla. Revisa que el codigo no exista."
}
```

Ocurre cuando intentas crear o actualizar una plantilla con un `code` ya usado.

## Error al guardar hoja

```json
{
  "message": "Datos invalidos para guardar la hoja."
}
```

El body debe incluir:

```json
{
  "pageFormat": "A4",
  "pageOrientation": "LANDSCAPE",
  "pageWidthMm": 297,
  "pageHeightMm": 210,
  "designerJson": {
    "schemas": [[]]
  }
}
```

Valores aceptados:

| Campo | Valores |
| --- | --- |
| `pageFormat` | `A4`, `LETTER`, `LEGAL`, `CUSTOM` |
| `pageOrientation` | `PORTRAIT`, `LANDSCAPE` |
| `pageWidthMm` | numero positivo |
| `pageHeightMm` | numero positivo |
| `designerJson` | objeto pdfme opcional |

## Estado actual del render

`POST /api/v1/render` responde `501` aunque la API key sea valida:

```json
{
  "ok": false,
  "message": "Render reservado. Falta conectar pdfme generator al TemplateVersion actual.",
  "received": {}
}
```

Esto no es un fallo de autenticacion. Significa que falta implementar el generador final de PDF.
