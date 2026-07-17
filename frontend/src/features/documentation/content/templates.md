# Plantillas y variables

Una plantilla contiene la configuración de página y el `designerJson` de pdfme. Su `code` identifica el diseño ante otros sistemas.

## Crear y guardar

1. En **Plantillas**, selecciona **Nueva plantilla**.
2. Define un nombre, un `code` y los tags necesarios.
3. Abre el editor, configura el formato y agrega los elementos.
4. Guarda antes de abrir la vista previa.
5. Crea una versión nueva cuando necesites conservar el estado anterior.

## Texto con variables

Un elemento `multiVariableText` separa dos conceptos:

| Propiedad | Función |
| --- | --- |
| `text` | Texto completo que se debe renderizar. Puede combinar contenido fijo, Markdown y `{variables}`. |
| `content` | Objeto JSON con el valor de cada variable para vista previa o render. |
| `variables` | Lista de nombres detectados en `text`. |
| `textFormat` | `plain` o `inline-markdown`. |
| `fontVariants` | Fuentes usadas para negrita, cursiva y código. |

Ejemplo:

```json
{
  "name": "datos_curso",
  "type": "multiVariableText",
  "text": "Culminó el **Diplomado en Nutrición** con {horas} horas.",
  "content": "{\"horas\":\"64\"}",
  "variables": ["horas"],
  "textFormat": "inline-markdown"
}
```

La vista previa debe tomar **todo el valor de `text`** y reemplazar solamente `{horas}`. El resultado esperado es:

```txt
Culminó el Diplomado en Nutrición con 64 horas.
```

No debe mostrar solo `horas`, `{}` ni el nombre de la variable. Esos resultados indican que se envió el objeto equivocado al renderer.

## Markdown en línea

Con `textFormat: "inline-markdown"` puedes usar:

```txt
**negrita**
*cursiva*
`código`
```

Para que la negrita use la fuente correcta, configura `fontVariants.bold`. Si no existe una variante, el sistema puede usar el fallback sintético.

## Nombres recomendados

- Usa `snake_case`: `nombre_completo`, `fecha_emision`.
- Evita espacios, tildes y caracteres especiales.
- No repitas un nombre para datos con significados diferentes.
- Mantén valores de prueba en `content` para validar la vista previa.

## Versión actual

Cada plantilla puede tener varias versiones, pero solo una se marca como actual. El catálogo y las futuras operaciones de render deben trabajar con esa versión. Confirma la versión activa antes de cambiar el diseño que usa una integración.
