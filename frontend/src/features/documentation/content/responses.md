# Respuestas y errores

Las respuestas JSON de error usan la propiedad `message`.

## Códigos de la API pública

| Código | Significado | Caso actual |
| --- | --- | --- |
| `200` | Solicitud correcta | Listado de plantillas. |
| `401` | No autorizado | API key ausente, inválida, deshabilitada, expirada o no permitida para el origen. |
| `501` | Función aún no implementada | Render autenticado, pero generador pendiente. |

## API key inválida

```json
{
  "message": "API key invalida."
}
```

Revisa, en este orden:

1. El header se llama exactamente `x-api-key`.
2. La clave corresponde al valor completo mostrado al crearla.
3. La credencial está activa y no expiró.
4. El origen del request está incluido en `allowedOrigins`, si se configuró esa restricción.

## Render reservado

Respuesta actual de `POST /api/v1/render` con una clave válida:

```json
{
  "ok": false,
  "message": "Render reservado. Falta conectar pdfme generator al TemplateVersion actual.",
  "received": {
    "templateCode": "c1_docencia_en_salud_a9d8a3d7",
    "input": {
      "nombre_completo": "María Pérez Ramos"
    }
  }
}
```

Este `501` no indica un problema de autenticación. La API aceptó la clave y devolvió el body recibido para diagnóstico.

## Errores dentro de la aplicación

Las rutas administrativas usan la cookie de sesión, permisos y códigos adicionales:

| Código | Caso frecuente |
| --- | --- |
| `400` | Body inválido o formato de página incorrecto. |
| `401` | Sesión inexistente o vencida. |
| `403` | El usuario no tiene el permiso requerido. |
| `404` | Plantilla, versión o credencial inexistente. |
| `409` | El `code` de una plantilla ya está en uso. |

## Salud del backend

```http
GET /api/health
```

```json
{
  "ok": true,
  "service": "pdfme-server-backend"
}
```
