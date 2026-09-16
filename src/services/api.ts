import { QRCodeItem, GoogleBusiness, User } from '../types.ts';

const TOKEN_KEY = 'vinicode_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string, confirmPassword: string) {
    const data = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    setStoredToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  // QR Codes
  async getQRCodes() {
    return request<{ qrCodes: QRCodeItem[] }>('/api/qr');
  },

  async createQRCode(name: string, destinationUrl: string, type: 'custom' | 'google_review' | 'nfc_ready' = 'custom') {
    return request<{ qrCode: QRCodeItem }>('/api/qr', {
      method: 'POST',
      body: JSON.stringify({ name, destinationUrl, type }),
    });
  },

  async updateQRCode(id: string, updates: { name?: string; destinationUrl?: string; active?: boolean }) {
    return request<{ qrCode: QRCodeItem }>(`/api/qr/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteQRCode(id: string) {
    return request<{ success: boolean }>(`/api/qr/${id}`, {
      method: 'DELETE',
    });
  },

  // Google Businesses
  async resolveGoogleBusiness(linkOrName: string) {
    return request<{
      place: {
        businessName: string;
        address: string;
        city: string;
        placeId: string;
        reviewUrl: string;
      };
    }>('/api/google-business/resolve', {
      method: 'POST',
      body: JSON.stringify({ linkOrName }),
    });
  },

  async getGoogleBusinesses() {
    return request<{ businesses: GoogleBusiness[] }>('/api/google-business');
  },

  async saveGoogleBusiness(data: {
    businessName: string;
    address: string;
    city: string;
    placeId: string;
    reviewUrl: string;
    qrCodeId?: string;
  }) {
    return request<{ business: GoogleBusiness }>('/api/google-business', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteGoogleBusiness(id: string) {
    return request<{ success: boolean }>(`/api/google-business/${id}`, {
      method: 'DELETE',
    });
  },
};
