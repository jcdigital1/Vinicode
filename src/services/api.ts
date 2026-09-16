import { QRCodeItem, GoogleBusiness, User } from '../types.ts';
import { getSupabase, isSupabaseConfigured } from './supabase.ts';
import { formatErrorMessage } from './authService.ts';

const TOKEN_KEY = 'vinicode_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// Defensive request that NEVER throws "The string did not match the expected pattern"
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (err: any) {
    console.error('[API Fetch Error]', err);
    throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.');
  }

  let responseText = '';
  try {
    responseText = await res.text();
  } catch (err: any) {
    console.error('[API Text Read Error]', err);
    throw new Error('Falha ao processar resposta do servidor.');
  }

  let data: any = null;
  if (responseText && responseText.trim().length > 0) {
    try {
      data = JSON.parse(responseText);
    } catch {
      // If response is HTML / 404
      if (res.status === 404) {
        throw new Error('Serviço de API não encontrado neste domínio.');
      }
      throw new Error(`Erro inesperado na resposta do servidor (${res.status}).`);
    }
  }

  if (!res.ok) {
    const rawError = data?.error || data?.message || `Erro na requisição (${res.status})`;
    throw new Error(formatErrorMessage(rawError));
  }

  return data as T;
}

// Generate permanent 7-char code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const api = {
  // Auth endpoints (Built-in backend fallback)
  async register(name: string, email: string, password: string, confirmPassword: string) {
    const data = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    if (data.token) setStoredToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setStoredToken(data.token);
    return data;
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async requestPasswordReset(email: string) {
    return request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async updatePassword(password: string) {
    return request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  // QR Codes: Uses Supabase when available; otherwise falls back to API
  async getQRCodes(): Promise<{ qrCodes: QRCodeItem[] }> {
    const supabase = getSupabase();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { qrCodes: [] };
      }

      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase QR query error - falling back to API]', error);
        return request<{ qrCodes: QRCodeItem[] }>('/api/qr');
      }

      const items: QRCodeItem[] = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        code: row.code,
        name: row.name,
        destinationUrl: row.destination_url,
        active: Boolean(row.active),
        type: row.type || 'custom',
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
        scanCount: Number(row.scan_count || 0),
        lastScannedAt: row.last_scanned_at || null,
      }));

      return { qrCodes: items };
    }

    return request<{ qrCodes: QRCodeItem[] }>('/api/qr');
  },

  async createQRCode(
    name: string,
    destinationUrl: string,
    type: 'custom' | 'google_review' | 'nfc_ready' = 'custom'
  ): Promise<{ qrCode: QRCodeItem }> {
    const supabase = getSupabase();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const code = generateCode();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: user.id,
          code,
          name: name.trim(),
          destination_url: destinationUrl.trim(),
          active: true,
          type,
          created_at: now,
          updated_at: now,
          scan_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.warn('[Supabase create error - falling back to API]', error);
        return request<{ qrCode: QRCodeItem }>('/api/qr', {
          method: 'POST',
          body: JSON.stringify({ name, destinationUrl, type }),
        });
      }

      const item: QRCodeItem = {
        id: data.id,
        userId: data.user_id,
        code: data.code,
        name: data.name,
        destinationUrl: data.destination_url,
        active: Boolean(data.active),
        type: data.type || 'custom',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        scanCount: Number(data.scan_count || 0),
        lastScannedAt: data.last_scanned_at || null,
      };

      return { qrCode: item };
    }

    return request<{ qrCode: QRCodeItem }>('/api/qr', {
      method: 'POST',
      body: JSON.stringify({ name, destinationUrl, type }),
    });
  },

  async updateQRCode(
    id: string,
    updates: { name?: string; destinationUrl?: string; active?: boolean }
  ): Promise<{ qrCode: QRCodeItem }> {
    const supabase = getSupabase();
    if (supabase) {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.destinationUrl !== undefined) payload.destination_url = updates.destinationUrl.trim();
      if (updates.active !== undefined) payload.active = updates.active;

      const { data, error } = await supabase
        .from('qr_codes')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('[Supabase update error - falling back to API]', error);
        return request<{ qrCode: QRCodeItem }>(`/api/qr/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      }

      const item: QRCodeItem = {
        id: data.id,
        userId: data.user_id,
        code: data.code,
        name: data.name,
        destinationUrl: data.destination_url,
        active: Boolean(data.active),
        type: data.type || 'custom',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        scanCount: Number(data.scan_count || 0),
        lastScannedAt: data.last_scanned_at || null,
      };

      return { qrCode: item };
    }

    return request<{ qrCode: QRCodeItem }>(`/api/qr/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteQRCode(id: string): Promise<{ success: boolean }> {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('qr_codes').delete().eq('id', id);
      if (error) {
        console.warn('[Supabase delete error - falling back to API]', error);
        return request<{ success: boolean }>(`/api/qr/${id}`, { method: 'DELETE' });
      }
      return { success: true };
    }

    return request<{ success: boolean }>(`/api/qr/${id}`, {
      method: 'DELETE',
    });
  },

  // Public resolver for dynamic QR redirect on client-side (Vercel SPA fallback)
  async getPublicQRDestination(code: string): Promise<{ destinationUrl: string; active: boolean } | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('destination_url, active, id, scan_count')
        .eq('code', code.trim().toUpperCase())
        .single();

      if (!error && data) {
        // Increment scan count asynchronously
        supabase
          .from('qr_codes')
          .update({
            scan_count: (data.scan_count || 0) + 1,
            last_scanned_at: new Date().toISOString(),
          })
          .eq('id', data.id)
          .then();

        return {
          destinationUrl: data.destination_url,
          active: Boolean(data.active),
        };
      }
    }

    try {
      return await request<{ destinationUrl: string; active: boolean }>(`/api/qr/public/${code}`);
    } catch {
      return null;
    }
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

  async getGoogleBusinesses(): Promise<{ businesses: GoogleBusiness[] }> {
    const supabase = getSupabase();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { businesses: [] };

      const { data, error } = await supabase
        .from('google_businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const items: GoogleBusiness[] = data.map((b: any) => ({
          id: b.id,
          userId: b.user_id,
          businessName: b.business_name,
          address: b.address || '',
          city: b.city || '',
          placeId: b.place_id,
          reviewUrl: b.review_url,
          createdAt: b.created_at,
        }));
        return { businesses: items };
      }
    }

    return request<{ businesses: GoogleBusiness[] }>('/api/google-business');
  },

  async saveGoogleBusiness(data: {
    businessName: string;
    address: string;
    city: string;
    placeId: string;
    reviewUrl: string;
    qrCodeId?: string;
  }): Promise<{ business: GoogleBusiness }> {
    const supabase = getSupabase();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: created, error } = await supabase
          .from('google_businesses')
          .insert({
            user_id: user.id,
            business_name: data.businessName,
            address: data.address,
            city: data.city,
            place_id: data.placeId,
            review_url: data.reviewUrl,
            qr_code_id: data.qrCodeId || null,
          })
          .select()
          .single();

        if (!error && created) {
          return {
            business: {
              id: created.id,
              userId: created.user_id,
              businessName: created.business_name,
              address: created.address,
              city: created.city,
              placeId: created.place_id,
              reviewUrl: created.review_url,
              createdAt: created.created_at,
            },
          };
        }
      }
    }

    return request<{ business: GoogleBusiness }>('/api/google-business', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteGoogleBusiness(id: string): Promise<{ success: boolean }> {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('google_businesses').delete().eq('id', id);
      if (!error) return { success: true };
    }

    return request<{ success: boolean }>(`/api/google-business/${id}`, {
      method: 'DELETE',
    });
  },
};
