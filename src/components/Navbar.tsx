import React from 'react';
import { Home, QrCode, Plus, Star, User as UserIcon, Radio } from 'lucide-react';
import { Logo } from './Logo.tsx';
import { User } from '../types.ts';

export type NavTab = 'dashboard' | 'qrcodes' | 'google_review';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateQR: () => void;
  onOpenAccount: () => void;
  onOpenNfcInfo: () => void;
  user: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateQR,
  onOpenAccount,
  onOpenNfcInfo,
  user,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo with Slogan on desktop */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="cursor-pointer shrink-0"
        >
          <Logo size="md" showSlogan={false} />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
          <button
            id="nav-btn-home"
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Início</span>
          </button>

          <button
            id="nav-btn-qrcodes"
            onClick={() => onSelectTab('qrcodes')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentTab === 'qrcodes'
                ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Meus QR Codes</span>
          </button>

          <button
            id="nav-btn-google-review"
            onClick={() => onSelectTab('google_review')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentTab === 'google_review'
                ? 'bg-amber-950/40 text-amber-300 border border-amber-800/50 shadow-sm'
                : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-900/60'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-500/20 text-amber-400" />
            <span>Avaliação Google</span>
          </button>

          <button
            id="nav-btn-nfc"
            onClick={onOpenNfcInfo}
            className="px-3 py-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-900/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Preparação para Placas e NFC"
          >
            <Radio className="w-4 h-4 text-red-500" />
            <span>NFC & Placas</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* + Novo QR Code */}
          <button
            id="nav-btn-new-qr"
            onClick={onOpenCreateQR}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">NOVO QR CODE</span>
            <span className="sm:hidden">NOVO QR</span>
          </button>

          {/* Minha Conta */}
          <button
            id="nav-btn-account"
            onClick={onOpenAccount}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
            title="Minha Conta"
          >
            <UserIcon className="w-4 h-4 text-zinc-400" />
            {user && (
              <span className="hidden lg:inline font-medium max-w-[90px] truncate">
                {user.name.split(' ')[0]}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sub-Navbar (Compact & accessible) */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-800/60 bg-[#0c0c0e]/95 px-2 py-1.5 text-[11px] font-medium">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg ${
            currentTab === 'dashboard' ? 'text-red-500' : 'text-zinc-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Início</span>
        </button>

        <button
          onClick={() => onSelectTab('qrcodes')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg ${
            currentTab === 'qrcodes' ? 'text-red-500' : 'text-zinc-400'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Meus QR</span>
        </button>

        <button
          onClick={() => onSelectTab('google_review')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg ${
            currentTab === 'google_review' ? 'text-amber-400' : 'text-zinc-400'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Google</span>
        </button>

        <button
          onClick={onOpenNfcInfo}
          className="flex flex-col items-center py-1 px-2.5 rounded-lg text-zinc-400"
        >
          <Radio className="w-4 h-4 text-red-500" />
          <span>NFC</span>
        </button>
      </div>
    </header>
  );
};
