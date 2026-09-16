import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Logo } from './Logo.tsx';
import { authService, formatErrorMessage } from '../services/authService.ts';
import { User } from '../types.ts';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check if opened via password recovery link (#type=recovery or access_token in URL)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        setMode('reset');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    setLoading(true);
    try {
      if (mode === 'login') {
        const loggedUser = await authService.signIn(email, password);
        onAuthSuccess(loggedUser);
      } else if (mode === 'register') {
        const newUser = await authService.signUp(name, email, password, confirmPassword);
        onAuthSuccess(newUser);
      } else if (mode === 'forgot') {
        await authService.resetPassword(email);
        setMessage(
          'Enviamos um link de recuperação para seu e-mail. Verifique sua caixa de entrada para criar uma nova senha.'
        );
      } else if (mode === 'reset') {
        if (newPassword.length < 6) {
          throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('As senhas digitadas não coincidem.');
        }
        await authService.updatePassword(newPassword);
        setMessage('Sua senha foi redefinida com sucesso! Você já pode entrar.');
        setMode('login');
      }
    } catch (err: any) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-view-container"
      className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-6"
    >
      {/* Visual background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" showSlogan={true} />
        </div>

        {/* Auth Card */}
        <div className="w-full bg-[#141417] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {mode === 'login' && 'ENTRAR NA PLATAFORMA'}
              {mode === 'register' && 'CRIAR UMA NOVA CONTA'}
              {mode === 'forgot' && 'RECUPERAR ACESSO'}
              {mode === 'reset' && 'DEFINIR NOVA SENHA'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {mode === 'login' && 'Acesse seus QR Codes dinâmicos e placas'}
              {mode === 'register' && 'Crie sua conta e gerencie links que evoluem'}
              {mode === 'forgot' && 'Informe seu e-mail para receber o link de redefinição'}
              {mode === 'reset' && 'Digite sua nova senha de acesso'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="leading-relaxed">{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Modo Cadastro: Nome */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Nome completo
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

            {/* Email (login, register, forgot) */}
            {mode !== 'reset' && (
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
            )}

            {/* Senha (login, register) */}
            {(mode === 'login' || mode === 'register') && (
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
                        setMessage(null);
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
                    minLength={6}
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Confirmar Senha (register) */}
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
                    minLength={6}
                    placeholder="Repita a mesma senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Modo Reset: Nova Senha e Confirmação */}
            {mode === 'reset' && (
              <>
                <div>
                  <label
                    htmlFor="auth-new-password"
                    className="block text-xs font-semibold text-zinc-300 mb-1.5"
                  >
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-new-password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="auth-reset-confirm"
                    className="block text-xs font-semibold text-zinc-300 mb-1.5"
                  >
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-reset-confirm"
                      type="password"
                      required
                      minLength={6}
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Botão de Envio */}
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
                  {mode === 'forgot' && 'ENVIAR LINK DE RECUPERAÇÃO'}
                  {mode === 'reset' && 'SALVAR NOVA SENHA'}
                </span>
              )}
            </button>
          </form>

          {/* Navegação entre modos */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
            {mode === 'login' && (
              <p>
                Não tem uma conta?{' '}
                <button
                  id="btn-switch-register"
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                >
                  Criar conta
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p>
                Já possui uma conta?{' '}
                <button
                  id="btn-switch-login"
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                >
                  Entrar
                </button>
              </p>
            )}

            {(mode === 'forgot' || mode === 'reset') && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticação protegida e sincronizada em tempo real</span>
        </div>
      </div>
    </div>
  );
};
