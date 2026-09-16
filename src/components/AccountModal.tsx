import React from 'react';
import { X, User as UserIcon, Mail, Shield, Smartphone, LogOut, CheckCircle2 } from 'lucide-react';
import { User } from '../types.ts';

interface AccountModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div
      id="modal-account"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-[#141417] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-500">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                MINHA CONTA
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Sincronização em nuvem e segurança
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* User Details */}
          <div className="p-4 bg-[#0c0c0e] border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-base">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{user.name}</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sincronização entre dispositivos */}
          <div className="p-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Sincronização Multi-Dispositivo Ativa</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Seus QR Codes e estatísticas estão salvos com segurança no banco de dados. Ao fazer login em qualquer outro smartphone, tablet ou computador, todos os seus links estarão sincronizados em tempo real.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Banco de dados operacional e permanente</span>
            </div>
          </div>

          {/* Sair da Conta */}
          <button
            id="btn-logout"
            onClick={onLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-400 hover:text-red-300 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
