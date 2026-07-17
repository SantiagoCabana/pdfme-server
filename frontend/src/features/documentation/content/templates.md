# Plantillas

Una plantilla es el diseno pdfme guardado con un `code` estable. Ese `code` es el identificador que debe usar un sistema externo.

## Crear una plantilla

1. Entra a **Plantillas**.
2. Crea una plantilla con nombre claro.
3. Usa tags si necesitas organizar por categoria.
4. Abre el editor y ubica los campos variables.
5. Guarda los cambios.

## Campos variables

Los campos de texto pueden tener contenido fijo y variables entre llaves:

```txt
{nombre_completo}
{tipo_documento} : {nro_documento}
```

Tambien pueden mezclar texto fijo y variables:

```txt
En merito por culminar el curso con una duracion de {horas} horas.
```

## Markdown en textos

Si el campo usa `textFormat: "inline-markdown"`, puedes usar negritas como:

```txt
Diplomado Internacional en **Nutricion**
```

Para preview y render, el sistema debe conservar:

| Propiedad | Uso |
| --- | --- |
| `text` | Texto base con placeholders |
| `content` | Valores de ejemplo o valores inyectados |
| `variables` | Lista de variables detectadas |
| `textFormat` | `plain` o `inline-markdown` |
| `fontVariants` | Fuentes para bold, italic y code |

## Ejemplo de campo esperado

```json
{
  "name": "nombre_completo_alumno",
  "type": "multiVariableText",
  "text": "{nombre_completo}",
  "content": "{\"nombre_completo\":\"NOMBRES Y APELLIDOS\"}",
  "variables": ["nombre_completo"],
  "textFormat": "plain"
}
```

## Recomendaciones para plantillas

- Usa nombres de variables en `snake_case`.
- Evita variables con espacios o tildes.
- Mantén un ejemplo realista en `content` para que el preview sea util.
- Verifica QR, imagenes y textos antes de entregar el `code`.
- No cambies el `code` si ya existe una integracion externa usando esa plantilla.

## Version activa

La API siempre trabaja sobre la version marcada como actual. Si creas nuevas versiones, confirma cual queda activa antes de entregar la plantilla a un sistema externo.
