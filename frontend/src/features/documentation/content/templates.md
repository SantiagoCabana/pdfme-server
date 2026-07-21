# Plantillas y contrato de datos

Una plantilla define qué datos puede recibir el render. El consumidor externo no necesita conocer la estructura interna de pdfme; solo debe usar las claves detectadas por PDF Server.

## Identificador externo

| Campo | Uso para integración | Nota |
| --- | --- | --- |
| `code` | Sí | Se envía como `templateCode`. |
| `name` | Sí | Útil para mostrar o registrar. |
| `versionNumber` | Sí | Útil para auditoría. |
| `pageFormat` | Opcional | Permite validar tamaño esperado. |
| `pageOrientation` | Opcional | Permite validar orientación esperada. |
| `id` | No como contrato | Es interno de la app. |

## Variables de texto

Las variables de texto son los nombres entre llaves dentro de campos de texto:

```text
Otorgado a {nombre_completo}, identificado con {tipo_documento}: {nro_documento}
```

Payload esperado:

```json
{
  "input": {
    "nombre_completo": "Maria Perez Ramos",
    "tipo_documento": "DNI",
    "nro_documento": "11223344"
  }
}
```

Si la misma variable aparece en varias hojas, se envía una sola vez. Por ejemplo, `nombre_completo` se aplicará a todos los campos que usen `{nombre_completo}`.

## Objetos cambiables

Para objetos que no usan `{variable}` directamente, el editor permite marcarlos como dinámicos usando `#` al inicio del nombre del contenedor.

| Tipo soportado | Ejemplo de nombre en editor | Clave enviada en API |
| --- | --- | --- |
| QR | `#qr_alumno` | `qr_alumno` |
| QR repetido | `#qr_alumno#1`, `#qr_alumno#2` | `qr_alumno` |
| Imagen | `#firma_director` | `firma_director` |
| Código de barras | `#codigo_certificado` | `codigo_certificado` |
| Fecha | `#fecha_emision` | `fecha_emision` |

Tipos soportados actualmente: `image`, `qrcode`, `code128`, `date`, `dateTime`, `time`.

## Repetir el mismo QR en varias páginas

pdfme exige nombres de contenedor únicos. Para no enviar cinco claves distintas cuando el mismo QR aparece en varias hojas, usa un nombre base con sufijos:

| Hoja | Nombre del objeto en editor | Clave enviada |
| --- | --- | --- |
| 1 | `#qr_alumno#1` | `qr_alumno` |
| 2 | `#qr_alumno#2` | `qr_alumno` |
| 3 | `#qr_alumno__p3` | `qr_alumno` |
| 4 | `#qr_alumno__page4` | `qr_alumno` |

Payload:

```json
{
  "input": {
    "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
  }
}
```

El backend aplicará el mismo valor a todos los objetos cuyo nombre derive de `#qr_alumno`.

## Ver entradas detectadas desde la app

En el editor de plantilla usa **Acciones > Variables y objetos**. Esa vista muestra:

| Columna | Significado |
| --- | --- |
| Tipo | `Variable` u `Objeto qrcode`, `Objeto image`, etc. |
| Clave | Nombre que debe ir dentro de `input`. |
| Hojas | Páginas donde aparece. |
| Cantidad | Cantidad de contenedores que usan esa clave. |

El botón **Copiar JSON** genera un ejemplo listo para completar:

```json
{
  "input": {
    "nombre_completo": "",
    "nro_documento": "",
    "qr_alumno": ""
  }
}
```

## Ver entradas detectadas por API

```http
GET /api/v1/templates/:code/inputs
x-api-key: pk_live_xxxxxxxxxxxxxxxxx
```

Respuesta resumida:

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
      { "key": "nombre_completo", "pages": [1, 2, 3, 4, 5] }
    ],
    "objects": [
      { "key": "qr_alumno", "type": "qrcode", "pages": [1, 2, 3, 4, 5] }
    ]
  }
}
```

## Compatibilidad

| Cambio en plantilla | Impacto externo | Recomendación |
| --- | --- | --- |
| Mover un campo | Bajo | Mantener el mismo `code`. |
| Cambiar fuente, color o tamaño | Bajo | Mantener el mismo `code`. |
| Agregar variable requerida | Alto | Avisar y actualizar payload del consumidor. |
| Renombrar variable | Alto | Evitar si ya hay integraciones. |
| Cambiar `#qr_alumno` por `#qr_estudiante` | Alto | Cambia la clave esperada por la API. |
| Duplicar páginas manteniendo sufijos compatibles | Bajo | Usar el mismo nombre base con sufijos. |
