# Catálogo y plantillas

Una plantilla publicada es el contrato que usa una aplicación externa para generar un documento. El consumidor no debe depender del `id` interno; debe guardar el `code`, conocer las variables esperadas y enviar valores ya normalizados.

## Identificador estable

El campo `code` identifica la plantilla desde sistemas externos.

| Campo | Usar externamente | Uso recomendado | Observación |
| --- | --- | --- | --- |
| `code` | Sí | Guardarlo como `templateCode`. | Identificador estable para requests futuros. |
| `name` | Sí | Mostrarlo en paneles o logs internos. | No debe usarse para identificar la plantilla. |
| `id` | No | Solo soporte interno. | Puede cambiar o no ser útil fuera de la app. |
| `versionNumber` | Sí | Registrar la versión usada. | Permite auditar qué versión estaba publicada. |
| `pageFormat` | Sí | Validar tamaño esperado. | Ejemplo: `A4`. |
| `pageOrientation` | Sí | Validar orientación esperada. | Ejemplo: `LANDSCAPE`. |
| `tags` | Opcional | Filtrar catálogo en el consumidor. | No reemplaza al `code`. |

Si el `code` cambia, la integración se rompe. Para cambios visuales usa nuevas versiones, no nuevos códigos, salvo que quieras crear un contrato independiente.

## Catálogo disponible

El catálogo devuelve las plantillas visibles para una API key.

```http
GET /api/v1/templates
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

Respuesta típica:

```json
{
  "data": [
    {
      "id": "cmrpcj5y2000lhzhjmk1w81dp",
      "name": "Certificado Nutrición",
      "code": "certificado_nutricion_a9d8a3d7",
      "status": "DRAFT",
      "versionNumber": 1,
      "pageFormat": "A4",
      "pageOrientation": "LANDSCAPE",
      "pageWidthMm": 297,
      "pageHeightMm": 210,
      "tags": ["certificados", "diplomados"]
    }
  ]
}
```

## Contrato de variables

Cada variable dinámica aparece dentro del diseño como `{variable}`. El consumidor debe enviar esas claves dentro de `input`.

| Variable | Ejemplo | Responsable del formato |
| --- | --- | --- |
| `nombre_completo` | `María Pérez Ramos` | Sistema consumidor. |
| `tipo_documento` | `DNI` | Sistema consumidor. |
| `nro_documento` | `11223344` | Sistema consumidor. |
| `horas` | `64` | Sistema consumidor. |
| `fecha_emision` | `30 de septiembre del 2025` | Sistema consumidor. |

Envía valores finales de impresión. No delegues al PDF Server reglas de negocio como calcular fechas, convertir números, traducir estados o decidir textos legales.

## Campos estáticos y variables

No todos los textos del diseño requieren datos externos.

| Tipo de campo | En la plantilla | En el payload externo |
| --- | --- | --- |
| Texto fijo | `Latinoamérica, 30 de septiembre del 2025` | No se envía. |
| Texto con variable | `Otorgado a {nombre_completo}` | `nombre_completo`. |
| QR fijo | `https://dominio.com/verificar` | No se envía. |
| QR dinámico | `{url_verificacion}` | `url_verificacion`. |

Si un campo tiene `content: {}` no significa que esté vacío. En pdfme, el texto visible puede estar en `text` y las variables se reemplazan después.

## Reglas de compatibilidad

| Cambio en plantilla | Impacto externo | Recomendación |
| --- | --- | --- |
| Mover texto o imagen | Bajo | Mantener el mismo `code`. |
| Cambiar color o fuente | Bajo | Mantener el mismo `code`. |
| Agregar variable obligatoria | Alto | Avisar al consumidor antes de publicar. |
| Renombrar variable | Alto | Evitar; rompe payloads existentes. |
| Eliminar variable | Medio | Mantener tolerancia temporal si hay consumidores activos. |
| Cambiar significado de variable | Alto | Crear variable nueva con nombre explícito. |

## Payload recomendado

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

## Checklist antes de integrar

| Revisión | Resultado esperado |
| --- | --- |
| El consumidor tiene una API key propia. | Una clave por sistema o ambiente. |
| El `templateCode` existe en el catálogo. | Se obtiene desde `GET /api/v1/templates`. |
| Las variables coinciden exactamente. | Sin tildes, espacios ni cambios de mayúsculas. |
| Los datos ya llegan formateados. | Fechas, nombres y documentos listos para imprimir. |
| Hay trazabilidad. | Se registra `templateCode`, HTTP status y usuario solicitante. |
