export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface QRCodeItem {
  id: string;
  userId: string;
  code: string; // Permanent unique slug (e.g. 'AB7K92X')
  name: string;
  destinationUrl: string;
  active: boolean;
  type: 'custom' | 'google_review' | 'nfc_ready';
  createdAt: string;
  updatedAt: string;
  scanCount: number;
  lastScannedAt: string | null;
}

export interface QRScan {
  id: string;
  qrCodeId: string;
  scannedAt: string;
  userAgent?: string;
  ip?: string;
}

export interface GoogleBusiness {
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

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  totalScans: number;
}
