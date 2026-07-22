import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';

import { requireSession } from '../middleware/session-auth.js';
import { prisma } from '../prisma.js';

export const documentationRouter = Router();

const SETTING_ID = 'documentation_public';

const updateShareSchema = z.object({
  enabled: z.boolean(),
});

type DocumentationShareRow = {
  id: string;
  public_id: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

function createUuidV7() {
  const bytes = randomBytes(16);
  const timestamp = BigInt(Date.now());

  bytes[0] = Number((timestamp >> 40n) & 0xffn);
  bytes[1] = Number((timestamp >> 32n) & 0xffn);
  bytes[2] = Number((timestamp >> 24n) & 0xffn);
  bytes[3] = Number((timestamp >> 16n) & 0xffn);
  bytes[4] = Number((timestamp >> 8n) & 0xffn);
  bytes[5] = Number(timestamp & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function ensureShareTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS documentation_share_setting (
      id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL UNIQUE,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_by_id TEXT NULL,
      updated_by_id TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function serializeShare(row: DocumentationShareRow) {
  return {
    enabled: row.enabled,
    publicId: row.public_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function getOrCreateShareSetting(userId?: string | null) {
  await ensureShareTable();

  const rows = await prisma.$queryRaw<DocumentationShareRow[]>`
    INSERT INTO documentation_share_setting (id, public_id, enabled, created_by_id, updated_by_id)
    VALUES (${SETTING_ID}, ${createUuidV7()}, FALSE, ${userId ?? null}, ${userId ?? null})
    ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
    RETURNING id, public_id, enabled, created_at, updated_at
  `;

  return rows[0];
}

async function findEnabledShare(publicId: string) {
  await ensureShareTable();

  const rows = await prisma.$queryRaw<DocumentationShareRow[]>`
    SELECT id, public_id, enabled, created_at, updated_at
    FROM documentation_share_setting
    WHERE id = ${SETTING_ID} AND public_id = ${publicId} AND enabled = TRUE
    LIMIT 1
  `;

  return rows[0] ?? null;
}

documentationRouter.get('/documentation/share', requireSession, async (_request, response) => {
  const row = await getOrCreateShareSetting(response.locals.user?.id ?? null);
  response.json({ share: serializeShare(row) });
});

documentationRouter.post('/documentation/share', requireSession, async (_request, response) => {
  await getOrCreateShareSetting(response.locals.user?.id ?? null);

  const rows = await prisma.$queryRaw<DocumentationShareRow[]>`
    UPDATE documentation_share_setting
    SET enabled = TRUE, updated_by_id = ${response.locals.user?.id ?? null}, updated_at = NOW()
    WHERE id = ${SETTING_ID}
    RETURNING id, public_id, enabled, created_at, updated_at
  `;

  response.status(201).json({ share: serializeShare(rows[0]) });
});

documentationRouter.patch('/documentation/share', requireSession, async (request, response) => {
  const parsed = updateShareSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Estado invalido para el enlace publico.' });
    return;
  }

  await getOrCreateShareSetting(response.locals.user?.id ?? null);

  const rows = await prisma.$queryRaw<DocumentationShareRow[]>`
    UPDATE documentation_share_setting
    SET enabled = ${parsed.data.enabled}, updated_by_id = ${response.locals.user?.id ?? null}, updated_at = NOW()
    WHERE id = ${SETTING_ID}
    RETURNING id, public_id, enabled, created_at, updated_at
  `;

  response.json({ share: serializeShare(rows[0]) });
});

documentationRouter.post('/documentation/share/reset', requireSession, async (_request, response) => {
  await getOrCreateShareSetting(response.locals.user?.id ?? null);

  const rows = await prisma.$queryRaw<DocumentationShareRow[]>`
    UPDATE documentation_share_setting
    SET public_id = ${createUuidV7()}, enabled = TRUE, updated_by_id = ${response.locals.user?.id ?? null}, updated_at = NOW()
    WHERE id = ${SETTING_ID}
    RETURNING id, public_id, enabled, created_at, updated_at
  `;

  response.json({ share: serializeShare(rows[0]) });
});

documentationRouter.get('/documentation/share/:publicId', async (request, response) => {
  const row = await findEnabledShare(request.params.publicId);

  if (!row) {
    response.status(401).json({ message: 'El enlace publico de documentacion no esta activo.' });
    return;
  }

  response.json({ ok: true, share: serializeShare(row) });
});

documentationRouter.get('/mcp/context', (_request, response) => {
  response.json({
    name: 'pdfme-server',
    purpose: 'Servicio para administrar plantillas PDF, publicar versiones y generar documentos por API.',
    audience: ['IA asistente', 'integradores API', 'desarrolladores externos'],
    security: {
      public: 'Este contexto no expone usuarios, claves API, plantillas privadas ni datos renderizados.',
      authentication: 'La API operativa usa x-api-key. La app administrativa usa cookie de sesion HTTP-only.',
      documentationShare: 'La documentacion publica se controla con un unico enlace UUID activable, desactivable y reiniciable.',
    },
    api: {
      basePath: '/api',
      externalBasePath: '/api/v1',
      authHeader: 'x-api-key',
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
        dynamicLinks: 'Un enlace puede combinar variables en su etiqueta y destino. Ejemplo: [{codigo}](https://dominio/student/{codigo}).',
        dynamicObjects: 'Los objetos cuyo nombre empieza con # pueden actualizarse por API. Ejemplo: #qr_alumno#1 y #qr_alumno#2 usan input.qr_alumno.',
      },
      dynamicObjectTypes: ['image', 'qrcode', 'code128', 'date', 'dateTime', 'time'],
    },
    documentation: [
      { title: 'Vision general', url: '/documentation/getting-started' },
      { title: 'Autenticacion', url: '/documentation/authentication' },
      { title: 'Plantillas y contenido', url: '/documentation/templates' },
      { title: 'API e integracion', url: '/documentation/api' },
      { title: 'Errores y operacion', url: '/documentation/responses' },
    ],
  });
});
