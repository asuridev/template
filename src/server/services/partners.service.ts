import { getDb } from '../db';
import { storageService } from './storage.service';
import { sanitizeSvg } from '../helpers/svg-sanitizer';
import { fileTypeFromBuffer } from 'file-type';

type MulterFile = Express.Multer.File;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PartnerRow {
  id: string;
  is_active: number;
  config: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface HistoryRow {
  id: number;
  partner_id: string;
  config: string;
  changed_at: string;
  changed_by: string | null;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/svg+xml',
  'image/png',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const SIZE_LIMITS: Record<string, number> = {
  logoHeader: 500 * 1024,
  logoFooter: 500 * 1024,
  logoIcon:   200 * 1024,
  favicon:     50 * 1024,
};

// ─── Errors ──────────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(msg: string) { super(msg); this.name = 'NotFoundError'; }
}
export class ConflictError extends Error {
  statusCode = 409;
  constructor(msg: string) { super(msg); this.name = 'ConflictError'; }
}
export class BadRequestError extends Error {
  statusCode = 400;
  constructor(msg: string) { super(msg); this.name = 'BadRequestError'; }
}

// ─── Default config ──────────────────────────────────────────────────────────

import defaultConfigJson from '../default-config.json';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeConfig(config: any): any {
  const { id, isActive, branding, theme, params, auth, texts } = config;
  return { id, isActive, branding, theme, params, auth, texts };
}

function deepMerge(target: any, source: any): any {
  if (!source) return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val === undefined || val === null) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    if (val === '') continue;
    if (typeof val === 'object' && !Array.isArray(val) && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      output[key] = deepMerge(target[key] ?? {}, val);
    } else {
      output[key] = val;
    }
  }
  return output;
}

function mergeConfig(defaults: any, extra: any, overrides: any): any {
  const base   = JSON.parse(JSON.stringify(defaults));
  const merged = deepMerge(base, extra);
  return deepMerge(merged, overrides);
}

function parseConfigJson(buffer: Buffer): any {
  if (buffer.length > 100 * 1024) {
    throw new BadRequestError('configJson exceeds maximum size of 100 KB');
  }
  try {
    return JSON.parse(buffer.toString('utf-8'));
  } catch {
    throw new BadRequestError('configJson is not valid JSON');
  }
}

function parseUrls(urlsField?: string): any {
  const defaults = { homeCards: [] as string[] };
  if (!urlsField) return defaults;
  try {
    const parsed = JSON.parse(urlsField);
    return {
      privacyPolicy: parsed.privacyPolicy,
      terms:         parsed.terms,
      website:       parsed.website,
      homeCards:     Array.isArray(parsed.homeCards) ? parsed.homeCards : [],
    };
  } catch {
    throw new BadRequestError('urls field is not valid JSON');
  }
}

function validateRequiredFiles(files: Record<string, MulterFile>, required: string[]): void {
  for (const field of required) {
    if (!files[field]) {
      throw new BadRequestError(`Required file field '${field}' is missing`);
    }
  }
}

async function uploadAsset(
  partnerId: string,
  type: string,
  file: MulterFile,
): Promise<string> {
  const maxSize = SIZE_LIMITS[type] ?? 500 * 1024;
  if (file.size > maxSize) {
    throw new BadRequestError(`File '${type}' exceeds maximum size of ${maxSize / 1024} KB`);
  }

  // Detect real MIME type from buffer (not just the declared one)
  const detected = await fileTypeFromBuffer(file.buffer);
  const mimeType = detected?.mime ?? file.mimetype;

  if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestError(`File type '${mimeType}' is not allowed for '${type}'`);
  }

  const resolvedMime = ALLOWED_MIME_TYPES.has(file.mimetype) ? file.mimetype : mimeType;
  let buffer = file.buffer;
  if (resolvedMime === 'image/svg+xml') {
    buffer = sanitizeSvg(buffer);
  }

  return storageService.save(partnerId, type, buffer, resolvedMime);
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const partnersService = {

  // ── Public read ────────────────────────────────────────────────────────────

  findOne(partnerId: string): any {
    const db = getDb();
    const row = db.prepare('SELECT * FROM partners WHERE id = ?').get(partnerId) as PartnerRow | undefined;
    if (!row || !row.is_active) {
      throw new NotFoundError(`Partner '${partnerId}' not found`);
    }
    return sanitizeConfig(JSON.parse(row.config));
  },

  // ── Admin reads ────────────────────────────────────────────────────────────

  findAll(): any[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM partners ORDER BY created_at DESC').all() as PartnerRow[];
    return rows.map((r) => sanitizeConfig(JSON.parse(r.config)));
  },

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(dto: any, files: Record<string, MulterFile>, userSub: string): Promise<any> {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM partners WHERE id = ?').get(dto.id);
    if (existing) {
      throw new ConflictError(`Partner '${dto.id}' already exists`);
    }

    validateRequiredFiles(files, ['logoHeader', 'logoFooter', 'favicon']);

    const logoHeaderUrl = await uploadAsset(dto.id, 'logoHeader', files['logoHeader']);
    const logoFooterUrl = await uploadAsset(dto.id, 'logoFooter', files['logoFooter']);
    const faviconUrl    = await uploadAsset(dto.id, 'favicon',    files['favicon']);
    const logoIconUrl   = files['logoIcon']
      ? await uploadAsset(dto.id, 'logoIcon', files['logoIcon'])
      : undefined;

    let extraConfig: any = {};
    if (files['configJson']) {
      const parsed = parseConfigJson(files['configJson'].buffer);
      extraConfig = {
        ...(parsed.theme  ? { theme:  parsed.theme  } : {}),
        ...(parsed.params ? { params: parsed.params } : {}),
        ...(parsed.auth   ? { auth:   parsed.auth   } : {}),
        ...(parsed.texts  ? { texts:  parsed.texts  } : {}),
      };
    }

    const urls   = parseUrls(dto.urls);
    const isActive = dto.isActive === 'true' || dto.isActive === true;

    const config = mergeConfig(
      defaultConfigJson,
      extraConfig,
      {
        id: dto.id,
        isActive,
        branding: {
          brandName:    dto.brandName,
          tagline:      dto.tagline,
          logoHeader:   logoHeaderUrl,
          logoFooter:   logoFooterUrl,
          faviconUrl,
          logoIconUrl,
          supportEmail: dto.supportEmail,
          supportPhone: dto.supportPhone,
          websiteUrl:   dto.websiteUrl,
        },
        params: { urls },
      },
    );

    const configJson = JSON.stringify(config);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO partners (id, is_active, config, created_at, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(dto.id, isActive ? 1 : 0, configJson, now, now, userSub);

    db.prepare(`
      INSERT INTO partner_config_history (partner_id, config, changed_at, changed_by, change_type)
      VALUES (?, ?, ?, ?, 'CREATE')
    `).run(dto.id, configJson, now, userSub);

    return config;
  },

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(partnerId: string, dto: any, files: Record<string, MulterFile>, userSub: string): Promise<any> {
    const db = getDb();
    const row = db.prepare('SELECT * FROM partners WHERE id = ?').get(partnerId) as PartnerRow | undefined;
    if (!row) throw new NotFoundError(`Partner '${partnerId}' not found`);

    const prevConfig = row.config;
    const updatedConfig = JSON.parse(row.config);

    if (files['logoHeader']) updatedConfig.branding.logoHeader  = await uploadAsset(partnerId, 'logoHeader', files['logoHeader']);
    if (files['logoFooter']) updatedConfig.branding.logoFooter  = await uploadAsset(partnerId, 'logoFooter', files['logoFooter']);
    if (files['favicon'])    updatedConfig.branding.faviconUrl  = await uploadAsset(partnerId, 'favicon',    files['favicon']);
    if (files['logoIcon'])   updatedConfig.branding.logoIconUrl = await uploadAsset(partnerId, 'logoIcon',   files['logoIcon']);

    if (files['configJson']) {
      const extra = parseConfigJson(files['configJson'].buffer);
      if (extra.theme)  updatedConfig.theme  = extra.theme;
      if (extra.texts)  updatedConfig.texts  = deepMerge(updatedConfig.texts, extra.texts);
      if (extra.params) updatedConfig.params = extra.params;
      if (extra.auth)   updatedConfig.auth   = extra.auth;
    }

    if (dto.brandName)                        updatedConfig.branding.brandName    = dto.brandName;
    if (dto.tagline      !== undefined)        updatedConfig.branding.tagline      = dto.tagline;
    if (dto.supportEmail !== undefined)        updatedConfig.branding.supportEmail = dto.supportEmail;
    if (dto.supportPhone !== undefined)        updatedConfig.branding.supportPhone = dto.supportPhone;
    if (dto.websiteUrl   !== undefined)        updatedConfig.branding.websiteUrl   = dto.websiteUrl;
    if (dto.urls)                             updatedConfig.params.urls           = { ...updatedConfig.params.urls, ...parseUrls(dto.urls) };
    if (dto.isActive !== undefined) {
      const active = dto.isActive === 'true' || dto.isActive === true;
      updatedConfig.isActive = active;
    }

    updatedConfig.id = partnerId;
    const configJson = JSON.stringify(updatedConfig);
    const now = new Date().toISOString();
    const newIsActive = updatedConfig.isActive ? 1 : 0;

    db.prepare(`
      INSERT INTO partner_config_history (partner_id, config, changed_at, changed_by, change_type)
      VALUES (?, ?, ?, ?, 'UPDATE')
    `).run(partnerId, prevConfig, now, userSub);

    db.prepare(`
      UPDATE partners SET config = ?, is_active = ?, updated_at = ?, updated_by = ? WHERE id = ?
    `).run(configJson, newIsActive, now, userSub, partnerId);

    return updatedConfig;
  },

  // ── Status ─────────────────────────────────────────────────────────────────

  updateStatus(partnerId: string, isActive: boolean): { id: string; isActive: boolean } {
    const db = getDb();
    const row = db.prepare('SELECT * FROM partners WHERE id = ?').get(partnerId) as PartnerRow | undefined;
    if (!row) throw new NotFoundError(`Partner '${partnerId}' not found`);

    const config = JSON.parse(row.config);
    config.isActive = isActive;

    db.prepare(`
      UPDATE partners SET is_active = ?, config = ?, updated_at = ? WHERE id = ?
    `).run(isActive ? 1 : 0, JSON.stringify(config), new Date().toISOString(), partnerId);

    return { id: partnerId, isActive };
  },

  // ── Soft delete ─────────────────────────────────────────────────────────────

  softDelete(partnerId: string, userSub: string): { message: string } {
    const db = getDb();
    const row = db.prepare('SELECT * FROM partners WHERE id = ?').get(partnerId) as PartnerRow | undefined;
    if (!row) throw new NotFoundError(`Partner '${partnerId}' not found`);

    const now    = new Date().toISOString();
    const config = { ...JSON.parse(row.config), isActive: false };
    const configJson = JSON.stringify(config);

    db.prepare(`
      INSERT INTO partner_config_history (partner_id, config, changed_at, changed_by, change_type)
      VALUES (?, ?, ?, ?, 'DELETE')
    `).run(partnerId, row.config, now, userSub);

    db.prepare(`
      UPDATE partners SET is_active = 0, config = ?, updated_at = ?, updated_by = ? WHERE id = ?
    `).run(configJson, now, userSub, partnerId);

    return { message: 'Partner desactivado' };
  },

  // ── History ─────────────────────────────────────────────────────────────────

  getHistory(partnerId: string): any[] {
    const db = getDb();
    const exists = db.prepare('SELECT id FROM partners WHERE id = ?').get(partnerId);
    if (!exists) throw new NotFoundError(`Partner '${partnerId}' not found`);

    const rows = db.prepare(`
      SELECT * FROM partner_config_history WHERE partner_id = ? ORDER BY changed_at DESC
    `).all(partnerId) as HistoryRow[];

    return rows.map((r) => ({
      id:         r.id,
      partnerId:  r.partner_id,
      config:     JSON.parse(r.config),
      changedAt:  r.changed_at,
      changedBy:  r.changed_by,
      changeType: r.change_type,
    }));
  },

  // ── Asset upload ─────────────────────────────────────────────────────────────

  async uploadAssetFile(partnerId: string, type: string, file: MulterFile): Promise<{ url: string }> {
    const db = getDb();
    const exists = db.prepare('SELECT id FROM partners WHERE id = ?').get(partnerId);
    if (!exists) throw new NotFoundError(`Partner '${partnerId}' not found`);
    const url = await uploadAsset(partnerId, type, file);
    return { url };
  },

  // ── Config template ──────────────────────────────────────────────────────────

  getConfigTemplate(): any {
    return defaultConfigJson;
  },
};
