import { Router } from 'express';

export const documentationRouter = Router();

documentationRouter.get('/mcp/context', (_request, response) => {
  response.json({
    name: 'pdfme-server',
    purpose: 'Servicio para administrar plantillas PDF, publicar versiones y generar documentos por API.',
    audience: ['IA asistente', 'integradores API', 'desarrolladores externos'],
    security: {
      public: 'La documentacion y este contexto son publicos. No exponen usuarios, claves API, plantillas privadas ni datos renderizados.',
      authentication: 'La API operativa usa x-api-key. La app administrativa usa cookie de sesion HTTP-only.',
    },
    api: {
      basePath: '/api',
      externalBasePath: '/api/v1',
      authHeader: 'x-api-key',
      coreRule: 'La API entrega valores; la plantilla define como se representan. input no contiene instrucciones visuales.',
      endpoints: [
        { method: 'GET', path: '/api/v1/templates', description: 'Lista plantillas publicadas disponibles para integracion.' },
        { method: 'GET', path: '/api/v1/templates/:code/inputs', description: 'Devuelve variables y objetos cambiables esperados por una plantilla.' },
        { method: 'POST', path: '/api/v1/render', description: 'Genera un PDF desde templateCode e input.' },
      ],
      inputModel: {
        templateCode: 'Codigo estable de plantilla.',
        input: 'Objeto JSON con variables de texto y objetos dinamicos.',
        variables: 'Las variables se detectan por placeholders como {nombre_completo}. La misma clave se aplica en todas las paginas donde exista.',
        textModes: 'plain imprime texto simple; inline-markdown admite negrita, cursiva, tachado, codigo y enlaces definidos en la plantilla.',
        markdownValues: 'Los valores enviados para variables se insertan como texto literal. El formato Markdown debe definirse alrededor de la variable en la plantilla.',
        dynamicLinks: 'Un enlace puede combinar variables en su etiqueta y destino. Ejemplo: [{codigo}](https://portal.example.com/students/{codigo}). input.codigo contiene solo el codigo.',
        dynamicObjects: 'Los objetos cuyo nombre empieza con # pueden actualizarse por API. Ejemplo: #qr_alumno#1 y #qr_alumno#2 usan input.qr_alumno.',
      },
      contractRules: {
        templateCode: 'Debe ser el campo code devuelto por el catalogo. No debe usarse id, name ni un slug calculado.',
        valuesOnly: 'Cada propiedad de input contiene un valor. No contiene HTML, Markdown, arreglos serializados ni instrucciones visuales.',
        repeatedKeys: 'Una misma variable u objeto normalizado recibe el mismo valor en todas las paginas donde se use.',
        missingTextVariables: 'Una variable detectada ausente, null o con cadena vacia produce HTTP 400 y missingVariables.',
        missingDynamicObjects: 'Un objeto dinamico ausente no se incluye en missingVariables y conserva el comportamiento configurado en la plantilla.',
        additionalKeys: 'Una clave que no coincide con una variable, objeto dinamico o nombre interno no modifica la plantilla.',
      },
      componentContracts: {
        textVariable: 'Recibe texto literal. Ejemplo: nombre_completo = JUAN PEREZ.',
        markdownVariable: 'Recibe el dato que necesita la expresion de la plantilla, no Markdown ni HTML.',
        qrcode: 'Recibe el contenido final que debe codificarse, por ejemplo una URL completa.',
        image: 'Recibe un Data URI o una URL accesible para el backend.',
        date: 'Recibe una fecha en el formato acordado por la plantilla e integracion.',
      },
      example: {
        template: '[{codigo_alumno}](https://portal.example.com/students/{codigo_alumno}) y un objeto qrcode llamado #qr_alumno.',
        request: {
          templateCode: 'certificado_curso',
          input: {
            codigo_alumno: 'STU-000123',
            qr_alumno: 'https://portal.example.com/verify/STU-000123',
          },
        },
        explanation: 'codigo_alumno contiene solo el codigo porque la plantilla construye el enlace. qr_alumno contiene la URL final porque el componente QR codifica exactamente ese valor.',
      },
      renderResponse: {
        status: 200,
        contentType: 'application/pdf',
        body: 'PDF binario. No es JSON, base64 ni una URL.',
        clientHandling: 'Leer como Buffer o ArrayBuffer. No ejecutar JSON.parse sobre una respuesta exitosa.',
        boundary: 'Guardar, subir, enviar o registrar el PDF corresponde al sistema consumidor.',
      },
      errors: {
        400: 'Payload invalido o variables de texto faltantes.',
        401: 'API key ausente, invalida, expirada o no autorizada por origen.',
        404: 'Plantilla inexistente, archivada o sin version actual.',
        500: 'Fallo durante la generacion del documento.',
        502: 'Error del proxy o infraestructura; no es una respuesta funcional de la API.',
      },
      dynamicObjectTypes: ['image', 'qrcode', 'code128', 'date', 'dateTime', 'time'],
    },
    documentation: [
      { title: 'Vision general', url: '/documentation/getting-started' },
      { title: 'Plantillas y contenido', url: '/documentation/templates' },
      { title: 'Autenticacion', url: '/documentation/authentication' },
      { title: 'API e integracion', url: '/documentation/api' },
      { title: 'Errores y operacion', url: '/documentation/responses' },
    ],
  });
});
