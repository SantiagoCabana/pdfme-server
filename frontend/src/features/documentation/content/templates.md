# Plantillas y contenido

Esta página explica cómo construir el contenido de una plantilla: qué formato de texto elegir, cómo declarar variables, cómo crear enlaces y cómo exponer QR, imágenes, códigos o fechas para que luego puedan cambiarse por API.

## Modelo de una plantilla

Una plantilla combina tres niveles distintos. Mantenerlos separados evita errores al integrar:

| Nivel | Ejemplo | Función |
| --- | --- | --- |
| Contenedor | `d1_nombre_alumno` | Identifica un elemento dentro del editor. Debe ser único. |
| Variable de texto | `{nombre_completo}` | Declara un valor reemplazable dentro de un texto. Puede repetirse en varias hojas. |
| Objeto cambiable | `#qr_alumno#1` | Declara un elemento completo que puede recibir contenido desde la API. |

El nombre del contenedor organiza internamente a pdfme. Para una integración normal importan las variables entre llaves y los objetos cuyo nombre comienza con `#`.

## Texto simple o Markdown

Los campos `multiVariableText` permiten elegir el formato del contenido.

| Modo | Valor técnico | Usarlo cuando |
| --- | --- | --- |
| Simple | `plain` | Todo el texto comparte fuente, peso, color y estilo. |
| Markdown | `inline-markdown` | Una misma caja necesita negrita, cursiva, tachado, código o enlaces. |

El modo cambia cómo se interpreta el contenido de la caja. No cambia la sintaxis de las variables: `{nombre_completo}` funciona en ambos modos.

## Modo simple

En modo simple, el contenido se imprime literalmente y conserva saltos de línea.

```text
Se certifica que {nombre_completo}
completó el curso {nombre_curso}.
```

| Capacidad | Comportamiento |
| --- | --- |
| Variables | Sí, con `{clave}`. |
| Saltos de línea | Sí. |
| Alineación y espaciado | Se configuran en el panel del editor. |
| Negrita parcial | No. Se aplica a toda la caja. |
| Enlaces clicables | No. |
| Símbolos `*`, `~` o `` ` `` | Se imprimen como texto normal. |

Usa este modo para nombres, documentos, fechas, títulos y cualquier campo con un solo estilo visual.

## Modo Markdown

Activa **Markdown** cuando necesites estilos dentro de una misma caja. PDF Server admite Markdown en línea, no documentos Markdown completos.

| Resultado | Sintaxis |
| --- | --- |
| Negrita | `**texto**` |
| Cursiva | `*texto*` |
| Negrita y cursiva | `***texto***` |
| Tachado | `~~texto~~` |
| Código | `` `texto` `` |
| Enlace | `[texto](https://dominio.com)` |

Ejemplo:

```text
En mérito por culminar el **{nombre_curso}** con una duración de **{horas} horas**.
```

La API debe enviar valores normales:

```json
{
  "nombre_curso": "Diplomado Internacional en Nutrición",
  "horas": "64"
}
```

El estilo está definido en la plantilla; el consumidor no necesita agregar los asteriscos.

## Fuentes para Markdown

Cada estilo puede usar una variante de fuente distinta:

| Variante | Propiedad | Ejemplo |
| --- | --- | --- |
| Base | `fontName` | `Poppins 400` |
| Negrita | `fontVariants.bold` | `Poppins 700` |
| Cursiva | `fontVariants.italic` | `Poppins 400 Italic` |
| Negrita cursiva | `fontVariants.boldItalic` | `Poppins 700 Italic` |
| Código | `fontVariants.code` | `Roboto Mono 400` |

Si una variante no está cargada, `fontVariantFallback: synthetic` intenta simular el estilo. Para un resultado consistente, carga y selecciona las variantes reales usadas por la plantilla.

## Caracteres literales en Markdown

Anteponles `\` cuando quieras imprimir caracteres de control sin aplicar formato.

```text
\**Este texto conserva los asteriscos\**
```

Se pueden escapar `\`, `*`, `~`, `` ` ``, `[`, `]`, `(` y `)`.

## Variables de texto

Una variable usa un nombre entre llaves:

```text
{nombre_completo}
```

También puedes combinar varias dentro de la misma caja:

```text
{tipo_documento}: {nro_documento}
```

| Regla | Ejemplo correcto |
| --- | --- |
| Usa letras, números y guion bajo. | `{fecha_emision}` |
| Mantén una convención estable. | `{nombre_completo}` |
| Evita espacios y signos. | No usar `{nombre completo}`. |
| Reutiliza la misma clave para el mismo dato. | `{nombre_completo}` en todas las hojas. |

Si una variable aparece en cinco páginas, se declara igual en todas. El nombre del contenedor puede cambiar, pero la variable permanece igual.

## Variables dentro de Markdown

Las variables pueden ocupar todo el fragmento o solo una parte:

```text
**{nombre_completo}**
```

```text
Curso: ***{nombre_curso}***
```

```text
Código: `{codigo_certificado}`
```

Los valores recibidos para una variable se insertan como texto literal. Si el valor contiene `**`, `~`, `` ` `` o corchetes, esos caracteres no crean un estilo nuevo. La negrita, la cursiva y los enlaces deben definirse en el contenido de la plantilla.

## Enlaces fijos

En modo Markdown, usa la sintaxis estándar:

```text
[Consultar certificado](https://bd.practissac.com)
```

El PDF mostrará el texto y conservará el destino clicable. Para un color concreto, configura `fontColor` en la caja.

## Enlace construido con una variable

Puedes mostrar un código y usarlo también dentro de la URL:

```text
[{codigo_qr_alumno}](https://bd.practissac.com/student/{codigo_qr_alumno})
```

Con el valor `3541397b0026`, el PDF muestra `3541397b0026` y abre:

```text
https://bd.practissac.com/student/3541397b0026
```

Cuando toda la caja es un único enlace y conserva el color negro predeterminado, PDF Server aplica azul `#1677ff`. pdfme agrega el subrayado y la anotación clicable. Si el enlace está mezclado con más texto, define el color deseado en el editor o utiliza una caja independiente.

## Enlace recibido completo

También puedes usar una variable cuyo valor ya sea la URL completa:

```text
[Abrir ficha]({url_ficha})
```

La integración enviará, por ejemplo, `https://bd.practissac.com/student/3541397b0026` en `url_ficha`.

## Objetos estáticos y cambiables

Una imagen, QR o fecha sin prefijo `#` conserva el contenido definido en la plantilla. Para permitir que la API reemplace el objeto completo, inicia su nombre con `#`.

| Tipo | Nombre en el editor | Clave externa |
| --- | --- | --- |
| Imagen | `#logo` | `logo` |
| QR | `#qr_alumno` | `qr_alumno` |
| Código 128 | `#codigo_certificado` | `codigo_certificado` |
| Fecha | `#fecha_emision` | `fecha_emision` |
| Fecha y hora | `#fecha_hora_emision` | `fecha_hora_emision` |
| Hora | `#hora_emision` | `hora_emision` |

Tipos cambiables detectados: `image`, `qrcode`, `code128`, `date`, `dateTime` y `time`.

El prefijo `#` solo se usa en el editor. En el JSON externo se envía la clave sin `#`.

## Repetir un objeto en varias páginas

pdfme requiere nombres de contenedor únicos. Agrega un sufijo reconocido para reutilizar una sola clave externa:

| Página | Nombre del contenedor | Clave resultante |
| --- | --- | --- |
| 1 | `#qr_alumno#1` | `qr_alumno` |
| 2 | `#qr_alumno#2` | `qr_alumno` |
| 3 | `#qr_alumno__p3` | `qr_alumno` |
| 4 | `#qr_alumno__page4` | `qr_alumno` |
| 5 | `#qr_alumno_page5` | `qr_alumno` |

Sufijos admitidos: `#<n>`, `__p<n>`, `__page<n>`, `_p<n>` y `_page<n>`, donde `<n>` es el número usado para diferenciar el contenedor.

## Imágenes dinámicas

Para imágenes, la forma más estable es enviar un Data URI:

```text
data:image/png;base64,iVBORw0KGgo...
```

Una URL remota exige que el backend pueda acceder al recurso durante el render. Usa HTTPS, evita enlaces temporales demasiado cortos y prueba el acceso desde el entorno donde corre PDF Server.

## QR y códigos de barras

El contenido del QR puede ser una URL, un identificador o cualquier texto válido:

```text
https://bd.practissac.com/student/CD8b5EB45412
```

El nombre `#qr_alumno` declara que el contenido es reemplazable. No agregues `{}` alrededor del valor de un objeto QR.

## Fechas y horas

Los objetos `date`, `dateTime` y `time` son elementos completos. Usa nombres con `#` si su valor debe llegar desde la API. Mantén un formato único por integración y verifica el resultado en la vista previa antes de publicar la versión.

| Tipo | Valor recomendado |
| --- | --- |
| `date` | `2026-07-22` |
| `dateTime` | `2026-07-22T15:30:00-05:00` |
| `time` | `15:30` |

Si necesitas una fecha redactada como `22 de julio de 2026`, normalmente conviene usar una variable de texto simple y enviarla ya formateada.

## Contenido fijo y valores predeterminados

| Contenido | Ejemplo | Comportamiento |
| --- | --- | --- |
| Fijo | `Certificado de participación` | Nunca cambia por una integración normal. |
| Variable | `{nombre_completo}` | Debe recibirse en `input`. |
| Predeterminado | Valor guardado en `content` | Se usa en el editor y puede servir como muestra. |
| Objeto cambiable | `#qr_alumno` | Se reemplaza si llega su clave externa. |

Las variables detectadas se consideran requeridas para render. Un valor predeterminado ayuda al diseño, pero no elimina esa validación en la API.

## Bloqueo y orden de capas

Bloquear un elemento evita seleccionarlo o moverlo accidentalmente en el editor. El bloqueo, la posición y el orden de capas no cambian su clave externa ni impiden que el backend lo renderice.

Usa bloqueo para fondos, marcos, firmas fijas y elementos terminados. Mantén desbloqueados solo los campos que todavía requieren ajustes visuales.

## Páginas, versiones y estado

| Concepto | Efecto |
| --- | --- |
| Página | Cada página conserva sus propios contenedores y bloqueos. |
| Versión actual | Es la versión que usa el render. |
| `DRAFT` | Puede renderizarse para pruebas si tiene versión actual válida. |
| `ACTIVE` | Estado recomendado para producción. |
| `ARCHIVED` | No está disponible para render externo. |

Duplicar páginas o plantillas no obliga a cambiar variables si el contrato externo debe seguir siendo el mismo.

## Revisar el contrato detectado

En el editor abre **Acciones > Variables y objetos**. La tabla muestra:

| Columna | Significado |
| --- | --- |
| Tipo | Variable de texto u objeto cambiable. |
| Clave | Propiedad que deberá existir dentro de `input`. |
| Hojas | Páginas donde se utiliza. |
| Cantidad | Número de elementos que comparten la clave. |

Usa **Copiar JSON** como base para una prueba. La API también expone este contrato mediante `GET /api/v1/templates/:code/inputs`.

## Lista de verificación

Antes de publicar una plantilla:

1. Confirma que cada contenedor tenga un nombre único.
2. Reutiliza exactamente la misma variable cuando un dato se repita.
3. Usa modo simple si toda la caja tiene un solo estilo.
4. Usa Markdown únicamente en cajas que necesiten formato parcial o enlaces.
5. Configura variantes reales de fuente para negrita y cursiva.
6. Nombra con `#` solo los objetos que deban cambiar por API.
7. Usa sufijos reconocidos para repetir objetos en varias páginas.
8. Revisa **Variables y objetos** y prueba el JSON generado.
9. Verifica todas las páginas en vista previa.
10. Publica como `ACTIVE` antes de conectarla a producción.
