import { getSupabase, isSupabaseConfigured } from './supabase.ts';
import { api, setStoredToken, removeStoredToken } from './api.ts';
import { User } from '../types.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Translates all raw tech/network/auth errors into clean, professional Portuguese
export function formatErrorMessage(err: any): string {
  if (!err) return 'Ocorreu um erro inesperado. Tente novamente.';
  const msg = typeof err === 'string' ? err : err.message || err.error_description || '';
  const lower = msg.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid password') ||
    lower.includes('user not found')
  ) {
    return 'E-mail ou senha incorretos.';
  }

  if (
    lower.includes('user already registered') ||
    lower.includes('already registered') ||
    lower.includes('email already in use')
  ) {
    return 'Já existe uma conta com este e-mail.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Por favor, confirme seu e-mail através do link enviado para sua caixa de entrada.';
  }

  if (
    lower.includes('password should be at least 6') ||
    lower.includes('weak password') ||
    lower.includes('senha com requisitos')
  ) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }

  if (
    lower.includes('valid email') ||
    lower.includes('invalid email') ||
    lower.includes('e-mail inválido')
  ) {
    return 'Digite um e-mail válido.';
  }

  if (
    lower.includes('did not match the expected pattern') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('connection refused')
  ) {
    return 'Não foi possível conectar. Verifique sua conexão e tente novamente.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.';
  }

  if (lower.includes('the page could not be found') || lower.includes('not_found')) {
    return 'Servidor indisponível ou rota não encontrada.';
  }

  // Fallback to formatted string without raw stacktraces
  return msg.length > 120 ? 'Erro ao processar requisição. Tente novamente.' : msg;
}

export const authService = {
  isCloudMode(): boolean {
    return isSupabaseConfigured();
  },

  async signUp(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<User> {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Informe seu nome completo.');
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('Digite um e-mail válido.');
    }

    if (!password || password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }

    if (password !== confirmPassword) {
      throw new Error('As senhas não coincidem.');
    }

    const supabase = getSupabase();
    if (supabase) {
      // Real Supabase Auth in production (Vercel)
      const redirectUrl =
        typeof window !== 'undefined' && window.location.origin
          ? `${window.location.origin}`
          : 'https://vinicode-alpha.vercel.app';

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw new Error(formatErrorMessage(error));
      }

      if (!data.user) {
        throw new Error('Não foi possível criar o usuário.');
      }

      // If user profile table exists or session was generated
      const user: User = {
        id: data.user.id,
        name: trimmedName,
        email: trimmedEmail,
        createdAt: data.user.created_at || new Date().toISOString(),
      };

      if (data.session?.access_token) {
        setStoredToken(data.session.access_token);
      }

      return user;
    }

    // Default backend API
    try {
      const res = await api.register(trimmedName, trimmedEmail, password, confirmPassword);
      return res.user;
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  },

  async signIn(email: string, password: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('Digite um e-mail válido.');
    }

    if (!password) {
      throw new Error('Informe sua senha.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw new Error(formatErrorMessage(error));
      }

      if (!data.user) {
        throw new Error('E-mail ou senha incorretos.');
      }

      const user: User = {
        id: data.user.id,
        name:
          data.user.user_metadata?.name ||
          data.user.user_metadata?.full_name ||
          trimmedEmail.split('@')[0],
        email: data.user.email || trimmedEmail,
        createdAt: data.user.created_at || new Date().toISOString(),
      };

      if (data.session?.access_token) {
        setStoredToken(data.session.access_token);
      }

      return user;
    }

    // Default backend API
    try {
      const res = await api.login(trimmedEmail, password);
      return res.user;
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.user) {
        return null;
      }

      const user = data.session.user;
      return {
        id: user.id,
        name:
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Usuário',
        email: user.email || '',
        createdAt: user.created_at || new Date().toISOString(),
      };
    }

    // Default backend API
    try {
      const res = await api.getMe();
      return res.user;
    } catch {
      return null;
    }
  },

  async resetPassword(email: string): Promise<void> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('Digite um e-mail válido.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const redirectUrl =
        typeof window !== 'undefined' && window.location.origin
          ? `${window.location.origin}#type=recovery`
          : 'https://vinicode-alpha.vercel.app#type=recovery';

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw new Error(formatErrorMessage(error));
      }
      return;
    }

    // Built-in API
    await api.requestPasswordReset(trimmedEmail);
  },

  async updatePassword(newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(formatErrorMessage(error));
      }
      return;
    }

    // Built-in API
    await api.updatePassword(newPassword);
  },

  async signOut(): Promise<void> {
    removeStoredToken();
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error during Supabase signout:', err);
      }
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          callback({
            id: session.user.id,
            name:
              session.user.user_metadata?.name ||
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              'Usuário',
            email: session.user.email || '',
            createdAt: session.user.created_at || new Date().toISOString(),
          });
        } else {
          callback(null);
        }
      });
      return () => data.subscription.unsubscribe();
    }
    return () => {};
  },
};
