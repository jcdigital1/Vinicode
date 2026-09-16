import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safely extract environment variables from Vite or Next/Vercel conventions
function getRawEnv(key: string): string | undefined {
  try {
    // @ts-ignore - import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return String(import.meta.env[key]).trim();
    }
  } catch {
    // ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {
    // ignore
  }

  return undefined;
}

// Validate URL strictly to prevent "The string did not match the expected pattern"
function isValidHttpUrl(candidate?: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed.includes('placeholder')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Validate Anon Key
function isValidKey(candidate?: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed.length < 10) {
    return false;
  }
  return true;
}

const rawUrl = getRawEnv('VITE_SUPABASE_URL') || getRawEnv('NEXT_PUBLIC_SUPABASE_URL');
const rawKey = getRawEnv('VITE_SUPABASE_ANON_KEY') || getRawEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

let client: SupabaseClient | null = null;
let configured = false;

if (isValidHttpUrl(rawUrl) && isValidKey(rawKey)) {
  try {
    client = createClient(rawUrl!, rawKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'vinicode_supabase_session',
      },
    });
    configured = true;
    console.log('[VINI CODE] Supabase conectado com sucesso em:', rawUrl);
  } catch (err) {
    console.error('[VINI CODE] Falha ao inicializar cliente Supabase:', err);
    client = null;
    configured = false;
  }
} else {
  if (rawUrl || rawKey) {
    console.warn(
      '[VINI CODE] Configurações de Supabase presentes mas com formato inválido. URL:',
      rawUrl
    );
  }
}

export function isSupabaseConfigured(): boolean {
  return configured && client !== null;
}

export function getSupabase(): SupabaseClient | null {
  return client;
}
