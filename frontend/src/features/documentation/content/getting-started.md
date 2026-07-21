# Visión general

PDF Server permite que un sistema externo genere PDFs usando plantillas administradas en la app. El consumidor solo necesita una API key, el `templateCode` de la plantilla y un objeto `input` con los datos que deben reemplazarse.

## Piezas de la integración

| Pieza | De dónde sale | Para qué sirve |
| --- | --- | --- |
| API key | Panel de administración, sección Claves API | Autoriza las llamadas externas. |
| `templateCode` | Catálogo API o detalle de plantilla | Identifica la plantilla que se va a renderizar. |
| Entradas detectadas | Botón Variables y objetos en el editor o endpoint `/inputs` | Define qué claves debe enviar el consumidor. |
| `input` | Backend consumidor | Contiene textos, QR, imágenes u otros valores dinámicos. |
| PDF | `POST /api/v1/render` | Documento final en `application/pdf`. |

## URLs usadas

| Entorno | Frontend | Backend API |
| --- | --- | --- |
| Local | `http://localhost:5173` | `http://localhost:4000/api` |
| Producción | `https://dominio.com` | `https://dominio.com/api` |

En local puedes probar directo contra el backend:

```bash
curl -sS "http://localhost:4000/api/v1/templates" \
  -H "x-api-key: $PDFME_API_KEY"
```

En producción usa la ruta pública bajo el mismo dominio:

```bash
curl -sS "https://dominio.com/api/v1/templates" \
  -H "x-api-key: $PDFME_API_KEY"
```

## Flujo recomendado

| Paso | Acción | Resultado |
| --- | --- | --- |
| 1 | Crear una API key para el sistema consumidor. | Tienes una `rawKey` segura para backend. |
| 2 | Consultar `GET /api/v1/templates`. | Obtienes el `templateCode`. |
| 3 | Consultar `GET /api/v1/templates/:code/inputs`. | Obtienes variables y objetos cambiables. |
| 4 | Construir el objeto `input`. | Las claves coinciden con la plantilla. |
| 5 | Llamar `POST /api/v1/render`. | Recibes el PDF final. |

## Payload mínimo

```json
{
  "templateCode": "certificado_nutricion_a9d8a3d7",
  "input": {
    "nombre_completo": "Maria Perez Ramos",
    "tipo_documento": "DNI",
    "nro_documento": "11223344",
    "qr_alumno": "http://bd.practissac.com/student/CD8b5EB45412"
  }
}
```

## Reglas rápidas

| Regla | Motivo |
| --- | --- |
| Llama la API desde backend, no desde JavaScript público. | La API key no debe exponerse al navegador. |
| Usa `code` como `templateCode`. | Es el identificador externo estable. |
| No uses nombres de contenedores pdfme para textos. | Para textos importan las variables entre `{}`. |
| Para QR, imágenes y fechas dinámicas usa nombres con `#` en el editor. | Así el backend sabe qué objetos puede reemplazar. |
| Envía fechas y textos ya formateados. | PDF Server no aplica reglas de negocio ni localización. |

> El contrato externo de una plantilla es la combinación de `templateCode` + entradas detectadas. Si cambias variables u objetos dinámicos en la plantilla, el sistema consumidor debe actualizar su payload.
