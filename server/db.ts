import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface QRCodeRecord {
  id: string;
  userId: string;
  code: string;
  name: string;
  destinationUrl: string;
  active: boolean;
  type: 'custom' | 'google_review' | 'nfc_ready';
  createdAt: string;
  updatedAt: string;
  scanCount: number;
  lastScannedAt: string | null;
}

export interface QRScanRecord {
  id: string;
  qrCodeId: string;
  scannedAt: string;
  userAgent?: string;
  ip?: string;
}

export interface GoogleBusinessRecord {
  id: string;
  userId: string;
  businessName: string;
  address: string;
  city: string;
  placeId: string;
  reviewUrl: string;
  qrCodeId?: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  qr_codes: QRCodeRecord[];
  qr_scans: QRScanRecord[];
  google_businesses: GoogleBusinessRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vinicode_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }

  // Initial Seed
  const demoSalt = bcrypt.genSaltSync(10);
  const demoHash = bcrypt.hashSync('123456', demoSalt);
  const demoUserId = 'usr_demo_vini';

  const initialDb: DatabaseSchema = {
    users: [
      {
        id: demoUserId,
        name: 'Vini Demonstração',
        email: 'contato@vinicode.com',
        passwordHash: demoHash,
        createdAt: new Date().toISOString(),
      },
    ],
    qr_codes: [
      {
        id: 'qr_demo_1',
        userId: demoUserId,
        code: 'VINI777',
        name: 'Instagram Oficial',
        destinationUrl: 'https://instagram.com',
        active: true,
        type: 'custom',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        scanCount: 142,
        lastScannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'qr_demo_2',
        userId: demoUserId,
        code: 'GOOG99',
        name: 'Avaliação Google — Restaurante Don Vini',
        destinationUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
        active: true,
        type: 'google_review',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        scanCount: 89,
        lastScannedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
    qr_scans: [],
    google_businesses: [
      {
        id: 'gb_demo_1',
        userId: demoUserId,
        businessName: 'Restaurante Don Vini',
        address: 'Av. Paulista, 1000 - Bela Vista',
        city: 'São Paulo - SP',
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
        qrCodeId: 'qr_demo_2',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ],
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error writing database:', err);
  }
}

// Generate secure, unique, non-sequential slug for QR code
export function generateUniqueSlug(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing I, 1, O, 0
  for (let attempt = 0; attempt < 50; attempt++) {
    let slug = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      slug += chars[bytes[i] % chars.length];
    }
    if (!existingCodes.has(slug.toUpperCase())) {
      return slug;
    }
  }
  // Fallback with timestamp suffix
  return 'V' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Normalize URL (e.g. 'instagram.com/user' -> 'https://instagram.com/user')
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const db = {
  // Users
  findUserByEmail(email: string): UserRecord | undefined {
    const database = loadDatabase();
    return database.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  },

  findUserById(id: string): UserRecord | undefined {
    const database = loadDatabase();
    return database.users.find((u) => u.id === id);
  },

  createUser(name: string, email: string, password: string):UserRecord {
    const database = loadDatabase();
    const existing = database.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      throw new Error('E-mail já cadastrado');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newUser: UserRecord = {
      id: 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    database.users.push(newUser);
    saveDatabase(database);
    return newUser;
  },

  verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  },

  // QR Codes
  getUserQRCodes(userId: string): QRCodeRecord[] {
    const database = loadDatabase();
    return database.qr_codes
      .filter((q) => q.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getQRCodeByCode(code: string): QRCodeRecord | undefined {
    const database = loadDatabase();
    return database.qr_codes.find((q) => q.code.toUpperCase() === code.trim().toUpperCase());
  },

  getQRCodeById(id: string): QRCodeRecord | undefined {
    const database = loadDatabase();
    return database.qr_codes.find((q) => q.id === id);
  },

  createQRCode(
    userId: string,
    name: string,
    destinationUrl: string,
    type: 'custom' | 'google_review' | 'nfc_ready' = 'custom',
    customCode?: string
  ): QRCodeRecord {
    const database = loadDatabase();
    const existingCodes = new Set(database.qr_codes.map((q) => q.code.toUpperCase()));
    
    let code = customCode ? customCode.trim().toUpperCase() : '';
    if (!code || existingCodes.has(code)) {
      code = generateUniqueSlug(existingCodes);
    }

    const normalizedDest = normalizeUrl(destinationUrl);
    const newQR: QRCodeRecord = {
      id: 'qr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      userId,
      code,
      name: name.trim() || 'Meu QR Code',
      destinationUrl: normalizedDest,
      active: true,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scanCount: 0,
      lastScannedAt: null,
    };

    database.qr_codes.push(newQR);
    saveDatabase(database);
    return newQR;
  },

  updateQRCode(
    userId: string,
    id: string,
    updates: { name?: string; destinationUrl?: string; active?: boolean }
  ): QRCodeRecord {
    const database = loadDatabase();
    const qrIndex = database.qr_codes.findIndex((q) => q.id === id && q.userId === userId);
    if (qrIndex === -1) {
      throw new Error('QR Code não encontrado ou sem permissão');
    }

    const current = database.qr_codes[qrIndex];
    const updated: QRCodeRecord = {
      ...current,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      destinationUrl: updates.destinationUrl !== undefined ? normalizeUrl(updates.destinationUrl) : current.destinationUrl,
      active: updates.active !== undefined ? updates.active : current.active,
      updatedAt: new Date().toISOString(),
      // The code (slug) NEVER changes!
      code: current.code,
    };

    database.qr_codes[qrIndex] = updated;
    saveDatabase(database);
    return updated;
  },

  deleteQRCode(userId: string, id: string): boolean {
    const database = loadDatabase();
    const initialLen = database.qr_codes.length;
    database.qr_codes = database.qr_codes.filter((q) => !(q.id === id && q.userId === userId));
    if (database.qr_codes.length !== initialLen) {
      database.qr_scans = database.qr_scans.filter((s) => s.qrCodeId !== id);
      saveDatabase(database);
      return true;
    }
    return false;
  },

  // Record scan and return destination
  recordScan(code: string, userAgent?: string, ip?: string): QRCodeRecord | null {
    const database = loadDatabase();
    const qrIndex = database.qr_codes.findIndex((q) => q.code.toUpperCase() === code.trim().toUpperCase());
    if (qrIndex === -1) {
      return null;
    }

    const qr = database.qr_codes[qrIndex];
    // Record scan even if inactive so owner sees attempts, but redirect only if active
    const now = new Date().toISOString();
    qr.scanCount = (qr.scanCount || 0) + 1;
    qr.lastScannedAt = now;

    const scanRecord: QRScanRecord = {
      id: 'scn_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      qrCodeId: qr.id,
      scannedAt: now,
      userAgent,
      ip,
    };

    database.qr_scans.push(scanRecord);
    saveDatabase(database);
    return qr;
  },

  // Google Businesses
  getGoogleBusinesses(userId: string): GoogleBusinessRecord[] {
    const database = loadDatabase();
    return database.google_businesses
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  saveGoogleBusiness(
    userId: string,
    businessName: string,
    address: string,
    city: string,
    placeId: string,
    reviewUrl: string,
    qrCodeId?: string
  ): GoogleBusinessRecord {
    const database = loadDatabase();
    const existingIndex = database.google_businesses.findIndex(
      (b) => b.userId === userId && b.placeId === placeId
    );

    if (existingIndex >= 0) {
      database.google_businesses[existingIndex] = {
        ...database.google_businesses[existingIndex],
        businessName,
        address,
        city,
        reviewUrl,
        qrCodeId: qrCodeId || database.google_businesses[existingIndex].qrCodeId,
      };
      saveDatabase(database);
      return database.google_businesses[existingIndex];
    }

    const newBusiness: GoogleBusinessRecord = {
      id: 'gb_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      userId,
      businessName,
      address,
      city,
      placeId,
      reviewUrl,
      qrCodeId,
      createdAt: new Date().toISOString(),
    };

    database.google_businesses.push(newBusiness);
    saveDatabase(database);
    return newBusiness;
  },

  deleteGoogleBusiness(userId: string, id: string): boolean {
    const database = loadDatabase();
    const initialLen = database.google_businesses.length;
    database.google_businesses = database.google_businesses.filter((b) => !(b.id === id && b.userId === userId));
    if (database.google_businesses.length !== initialLen) {
      saveDatabase(database);
      return true;
    }
    return false;
  }
};
