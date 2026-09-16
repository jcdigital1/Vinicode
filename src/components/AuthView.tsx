import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo.tsx';
import { api } from '../services/api.ts';
import { User } from '../types.ts';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        const res = await api.register(name, email, password, confirmPassword);
        onAuthSuccess(res.user);
      } else if (mode === 'forgot') {
        setMessage('Se o e-mail estiver cadastrado, as instruções de recuperação serão enviadas.');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Erro durante a autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-view-container"
      className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-6"
    >
      {/* Visual brand glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" showSlogan={true} />
        </div>

        {/* Auth Card */}
        <div className="w-full bg-[#141417] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {mode === 'login' && 'ENTRAR NA PLATAFORMA'}
              {mode === 'register' && 'CRIAR UMA NOVA CONTA'}
              {mode === 'forgot' && 'RECUPERAR ACESSO'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {mode === 'login' && 'Acesse seus QR Codes dinâmicos e placas'}
              {mode === 'register' && 'Crie sua conta e gerencie links que evoluem'}
              {mode === 'forgot' && 'Informe seu e-mail cadastrado'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800/70 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register: Nome */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Nome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                E-mail válido
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Senha */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-zinc-300"
                  >
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Confirmar Senha */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Confirmar senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    required
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-red-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Aguarde...</span>
                </>
              ) : (
                <span>
                  {mode === 'login' && 'ENTRAR'}
                  {mode === 'register' && 'CRIAR CONTA'}
                  {mode === 'forgot' && 'ENVIAR INSTRUÇÕES'}
                </span>
              )}
            </button>
          </form>

          {/* Switch Modes */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
            {mode === 'login' ? (
              <p>
                Não tem uma conta?{' '}
                <button
                  id="btn-switch-register"
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                >
                  Criar conta
                </button>
              </p>
            ) : (
              <p>
                Já possui uma conta?{' '}
                <button
                  id="btn-switch-login"
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Database security reminder */}
        <div className="mt-6 text-center text-xs text-zinc-400 max-w-xs">
          Seus QR Codes e estatísticas são salvos em banco de dados e sincronizados entre todos os seus dispositivos.
        </div>
      </div>
    </div>
  );
};
