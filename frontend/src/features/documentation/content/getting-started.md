# Primeros pasos

Esta guía explica el flujo diario de PDFme Server. La documentación usa la misma sesión y el mismo dominio que la aplicación.

## Flujo recomendado

1. Inicia sesión con tu usuario.
2. Abre **Plantillas** y crea una plantilla o selecciona una existente.
3. Configura la hoja, agrega los elementos y guarda los cambios.
4. Abre **Vista previa** y confirma textos, variables, imágenes y códigos QR.
5. Si otro sistema consumirá la API, crea una credencial en **Claves API**.
6. Entrega al integrador la URL del dominio, la clave y el `code` estable de la plantilla.

> La clave completa (`rawKey`) se muestra una sola vez. Guárdala en un gestor de secretos; si se pierde, crea otra y elimina la anterior.

## Secciones de la aplicación

| Sección | Uso |
| --- | --- |
| Plantillas | Crear, editar, previsualizar y versionar diseños. |
| Claves API | Crear, activar, desactivar o eliminar credenciales externas. |
| Tags | Clasificar plantillas. |
| Usuarios | Administrar cuentas y roles. |
| Permisos | Consultar o asignar capacidades. |
| Auditoría | Revisar operaciones realizadas en el sistema. |

Las secciones visibles dependen de los permisos de la sesión.

## Datos para una integración

| Dato | Ejemplo | Origen |
| --- | --- | --- |
| URL base | `https://dominio.com/api` | Dominio de la aplicación. |
| API key | `pk_live_xxxxx` | Claves API. |
| Template code | `c1_docencia_en_salud_a9d8a3d7` | Ficha de la plantilla. |
| Variables | `nombre_completo`, `nro_documento` | Elementos variables del editor. |

## Antes de entregar una plantilla

- Mantén estable el `code` si ya existe una integración.
- Revisa cuál versión está marcada como actual.
- Usa valores de ejemplo realistas en los campos variables.
- Confirma el resultado desde **Vista previa**, no solo desde el editor.
- Entrega al integrador únicamente las variables que la plantilla necesita.

Continúa con [Plantillas y variables](/documentation/templates).
