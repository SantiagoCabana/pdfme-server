# Catalogo y plantillas

Una plantilla es el contrato visual y tecnico que usa PDF Server para generar un documento. El consumidor externo solo necesita conocer el `code` de la plantilla y las claves que acepta `input`.

## Campos principales

| Campo | Para que sirve | Usarlo desde sistemas externos |
| --- | --- | --- |
| `code` | Identificador publico de la plantilla. | Si, como `templateCode`. |
| `name` | Nombre visible en la app. | Si, para mostrar al usuario. |
| `status` | Estado operativo. | Si, para filtrar plantillas productivas. |
| `versionNumber` | Version actual usada por render. | Si, para auditoria. |
| `id` | Identificador interno. | No como contrato externo. |
| `pageFormat` | Formato de pagina. | Opcional. |
| `pageOrientation` | Orientacion. | Opcional. |

## TemplateCode

El request de render debe enviar el campo `code`.

```json
{
  "templateCode": "nutricion",
  "input": {}
}
```

No envies `id`, `name` ni un texto parecido. Si una plantilla se llama `Nutricion` pero su `code` es `nutricion_2026`, el valor correcto es `nutricion_2026`.

## Estados

| Estado | Descripcion | Render API |
| --- | --- | --- |
| `DRAFT` | Plantilla en preparacion o pruebas. | Puede renderizar si tiene version actual valida. |
| `ACTIVE` | Plantilla lista para uso operativo. | Puede renderizar. |
| `ARCHIVED` | Plantilla retirada. | No renderiza; responde como no encontrada. |

Para integraciones productivas, publica y consume plantillas `ACTIVE`. Usa `DRAFT` solo para pruebas controladas.

## Version actual

El backend renderiza la version marcada como actual. La respuesta PDF incluye headers para auditarlo:

```http
x-template-code: nutricion
x-template-version: 3
```

Registra esos headers si necesitas demostrar que version genero cada documento.

## Variables de texto

Las variables de texto son placeholders escritos dentro del contenido:

```text
Otorgado a {nombre_completo}, identificado con {tipo_documento}: {nro_documento}
```

Payload:

```json
{
  "input": {
    "nombre_completo": "Maria Perez Ramos",
    "tipo_documento": "DNI",
    "nro_documento": "11223344"
  }
}
```

Si `{nombre_completo}` aparece en cinco hojas, se envia una sola vez. PDF Server aplica el mismo valor a todos los campos que usen esa variable.

## Texto con enlace

Para que una variable se muestre como texto clickeable, el campo debe usar `textFormat: inline-markdown` y el contenido debe escribirse como markdown link.

Ejemplo para mostrar el codigo del alumno y abrir su ficha:

```text
[{codigo_qr_alumno}](https://bd.practissac.com/student/{codigo_qr_alumno})
```

Request:

```json
{
  "input": {
    "codigo_qr_alumno": "3541397b0026"
  }
}
```

Resultado esperado en el PDF: el texto `3541397b0026` se muestra como enlace subrayado y abre `https://bd.practissac.com/student/3541397b0026`.

## Objetos dinamicos

Los objetos que no usan `{variable}` pueden declararse dinamicos iniciando el nombre del contenedor con `#`.

| Tipo | Nombre en editor | Clave enviada |
| --- | --- | --- |
| QR | `#qr_alumno` | `qr_alumno` |
| Imagen | `#logo` | `logo` |
| Codigo de barras | `#codigo_certificado` | `codigo_certificado` |
| Fecha | `#fecha_emision` | `fecha_emision` |
| Hora | `#hora_emision` | `hora_emision` |

Tipos soportados actualmente: `image`, `qrcode`, `code128`, `date`, `dateTime`, `time`.

## Repetir objetos en varias hojas

pdfme exige nombres de contenedor unicos. Para repetir el mismo QR sin enviar claves diferentes, usa sufijos compatibles sobre el mismo nombre base.

| Hoja | Nombre en editor | Clave API |
| --- | --- | --- |
| 1 | `#qr_alumno#1` | `qr_alumno` |
| 2 | `#qr_alumno#2` | `qr_alumno` |
| 3 | `#qr_alumno__p3` | `qr_alumno` |
| 4 | `#qr_alumno__page4` | `qr_alumno` |

Request:

```json
{
  "input": {
    "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
  }
}
```

## Inspeccion desde la app

En el editor usa **Acciones > Variables y objetos**. Esa vista lista el contrato de datos detectado y permite copiar un JSON base.

| Columna | Significado |
| --- | --- |
| Tipo | `Variable` u objeto dinamico como `Objeto qrcode`. |
| Clave | Nombre que debe ir dentro de `input`. |
| Hojas | Paginas donde aparece. |
| Cantidad | Numero de contenedores que usan esa clave. |

## Inspeccion por API

```http
GET /api/v1/templates/:code/inputs
x-api-key: API_KEY
```

Respuesta resumida:

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
      { "key": "nombre_completo", "pages": [1, 2, 3, 4, 5] }
    ],
    "objects": [
      { "key": "qr_alumno", "type": "qrcode", "pages": [1, 2, 3, 4, 5] }
    ]
  }
}
```

## Cambios compatibles

| Cambio en plantilla | Impacto externo | Recomendacion |
| --- | --- | --- |
| Mover un campo | Bajo | Mantener las mismas claves. |
| Cambiar fuente, color o tamaño | Bajo | No requiere cambio de API. |
| Agregar variable requerida | Alto | Avisar y actualizar payload del consumidor. |
| Renombrar variable | Alto | Evitar si ya hay integraciones. |
| Cambiar `#qr_alumno` por `#qr_estudiante` | Alto | Cambia la clave esperada. |
| Duplicar paginas con sufijos compatibles | Bajo | Mantener el mismo nombre base. |
