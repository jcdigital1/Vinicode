import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Star,
  Search,
  Filter,
  QrCode,
  Radio,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeItem, User, DashboardStats as StatsType } from './types.ts';
import { api, getStoredToken, removeStoredToken } from './services/api.ts';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { DashboardStats } from './components/DashboardStats.tsx';
import { QRCodeCard } from './components/QRCodeCard.tsx';
import { CreateQRModal } from './components/CreateQRModal.tsx';
import { EditQRModal } from './components/EditQRModal.tsx';
import { DownloadQRModal } from './components/DownloadQRModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { GoogleReviewSection } from './components/GoogleReviewSection.tsx';
import { NfcModal } from './components/NfcModal.tsx';
import { AccountModal } from './components/AccountModal.tsx';
import { AuthView } from './components/AuthView.tsx';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Active view tab: 'dashboard' | 'qrcodes' | 'google_review'
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // QR Codes data
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loadingQRs, setLoadingQRs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [initialCreateName, setInitialCreateName] = useState('');
  const [initialCreateUrl, setInitialCreateUrl] = useState('');

  const [editingItem, setEditingItem] = useState<QRCodeItem | null>(null);
  const [downloadingItem, setDownloadingItem] = useState<QRCodeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<QRCodeItem | null>(null);

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNfcOpen, setIsNfcOpen] = useState(false);

  // Check initial user authentication
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }

    api
      .getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        removeStoredToken();
        setUser(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  // Fetch QR codes when user is authenticated
  const loadQRCodes = async () => {
    if (!user) return;
    setLoadingQRs(true);
    setErrorMsg(null);
    try {
      const res = await api.getQRCodes();
      setQrCodes(res.qrCodes);
    } catch (err: any) {
      console.error('Error fetching QR codes:', err);
      setErrorMsg(err.message || 'Erro ao carregar QR Codes');
    } finally {
      setLoadingQRs(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadQRCodes();
    }
  }, [user]);

  // Logout handler
  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    setQrCodes([]);
    setIsAccountOpen(false);
  };

  // Stats calculation
  const stats: StatsType = useMemo(() => {
    const total = qrCodes.length;
    const active = qrCodes.filter((q) => q.active).length;
    const inactive = total - active;
    const totalScans = qrCodes.reduce((acc, q) => acc + (q.scanCount || 0), 0);
    return { total, active, inactive, totalScans };
  }, [qrCodes]);

  // Filtered QR codes list (Search in real-time by name, code, or destination)
  const filteredQRCodes = useMemo(() => {
    return qrCodes.filter((item) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !item.active) return false;
      if (statusFilter === 'INACTIVE' && item.active) return false;

      // Search query filter (name, code, or destinationUrl)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesUrl = item.destinationUrl.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesUrl;
      }

      return true;
    });
  }, [qrCodes, statusFilter, searchQuery]);

  // Open Create QR prefilled from Google Review generator
  const handleOpenCreateWithData = (name: string, destinationUrl: string) => {
    setInitialCreateName(name);
    setInitialCreateUrl(destinationUrl);
    setIsCreateOpen(true);
  };

  // Status toggle handler
  const handleToggleStatus = async (item: QRCodeItem) => {
    try {
      const res = await api.updateQRCode(item.id, { active: !item.active });
      setQrCodes((prev) => prev.map((q) => (q.id === item.id ? res.qrCode : q)));
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do QR Code');
    }
  };

  // Delete permanent
  const handleDeletePermanent = async (item: QRCodeItem) => {
    try {
      await api.deleteQRCode(item.id);
      setQrCodes((prev) => prev.filter((q) => q.id !== item.id));
      setDeletingItem(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir QR Code');
    }
  };

  // Deactivate from delete modal
  const handleDeactivateFromModal = async (item: QRCodeItem) => {
    try {
      const res = await api.updateQRCode(item.id, { active: false });
      setQrCodes((prev) => prev.map((q) => (q.id === item.id ? res.qrCode : q)));
      setDeletingItem(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao desativar QR Code');
    }
  };

  // Auth checking spinner
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Carregando VINI CODE...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show real auth view
  if (!user) {
    return <AuthView onAuthSuccess={(newUser) => setUser(newUser)} />;
  }

  return (
    <div id="vini-code-app-container" className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreateQR={() => {
          setInitialCreateName('');
          setInitialCreateUrl('');
          setIsCreateOpen(true);
        }}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenNfcInfo={() => setIsNfcOpen(true)}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* VIEW 1 & 2: DASHBOARD OU MEUS QR CODES */}
        {(currentTab === 'dashboard' || currentTab === 'qrcodes') && (
          <div className="space-y-6">
            {/* Header: VINI CODE - Gerencie seus QR Codes dinâmicos */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    VINI CODE
                  </h1>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400 bg-red-950/40 border border-red-900/40 px-2 py-0.5 rounded">
                    Dinâmico
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Gerencie seus QR Codes dinâmicos. Links que evoluem com seu negócio.
                </p>
              </div>

              {/* Dois botões principais requisitados na Seção 4 */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  id="btn-main-new-qr"
                  onClick={() => {
                    setInitialCreateName('');
                    setInitialCreateUrl('');
                    setIsCreateOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ NOVO QR CODE</span>
                </button>

                <button
                  id="btn-main-google-review"
                  onClick={() => setCurrentTab('google_review')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-amber-500/30 text-amber-300 hover:text-amber-200 font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>⭐ AVALIAÇÃO GOOGLE</span>
                </button>
              </div>
            </div>

            {/* Painel compacto de estatísticas: QR CODES | ATIVOS | INATIVOS | LEITURAS */}
            <DashboardStats stats={stats} />

            {/* Controls Bar: Pesquisa em tempo real + Filtros */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              {/* 🔎 Buscar por nome ou código... */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="search-input-qrcodes"
                  type="text"
                  placeholder="🔎 Buscar por nome, código ou destino..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141417] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-400 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Filtros: TODOS | ATIVOS | INATIVOS */}
              <div className="flex items-center gap-1 bg-[#141417] p-1 border border-zinc-800 rounded-xl shrink-0">
                <button
                  id="filter-all"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  TODOS ({stats.total})
                </button>

                <button
                  id="filter-active"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 shadow-sm'
                      : 'text-zinc-400 hover:text-emerald-400'
                  }`}
                >
                  ATIVOS ({stats.active})
                </button>

                <button
                  id="filter-inactive"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  INATIVOS ({stats.inactive})
                </button>
              </div>
            </div>

            {/* Error notice if any */}
            {errorMsg && (
              <div className="p-3.5 bg-red-950/60 border border-red-800/70 rounded-xl text-red-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  onClick={loadQRCodes}
                  className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800/70 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* QR Codes Compact Cards Grid */}
            <div id="qrcodes-list-section">
              {loadingQRs ? (
                <div className="py-16 text-center text-xs text-zinc-400 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span>Sincronizando com o banco de dados...</span>
                </div>
              ) : filteredQRCodes.length === 0 ? (
                <div className="py-16 px-4 bg-[#141417]/50 border border-dashed border-zinc-800 rounded-2xl text-center">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                    <QrCode className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {searchQuery
                      ? 'Nenhum QR Code encontrado para esta busca'
                      : 'Você ainda não possui QR Codes cadastrados'}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                    {searchQuery
                      ? 'Tente buscar por outro termo ou limpe o filtro.'
                      : 'Crie seu primeiro QR Code dinâmico com link permanente que pode ser editado a qualquer hora.'}
                  </p>
                  <button
                    onClick={() => {
                      setInitialCreateName('');
                      setInitialCreateUrl('');
                      setIsCreateOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    + CRIAR PRIMEIRO QR CODE
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredQRCodes.map((qr) => (
                    <QRCodeCard
                      key={qr.id}
                      item={qr}
                      onEdit={(item) => setEditingItem(item)}
                      onDownload={(item) => setDownloadingItem(item)}
                      onDelete={(item) => setDeletingItem(item)}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: ⭐ GERADOR DE AVALIAÇÃO GOOGLE */}
        {currentTab === 'google_review' && (
          <GoogleReviewSection
            onOpenCreateQRWithData={handleOpenCreateWithData}
            onNavigateToQRs={() => setCurrentTab('qrcodes')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">VINI CODE</span>
            <span>—</span>
            <span>QR Codes inteligentes. Links que evoluem.</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Banco em Nuvem Ativo
            </span>
            <button
              onClick={() => setIsNfcOpen(true)}
              className="text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              Tecnologia NFC
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Modal: Criar QR Code */}
      <CreateQRModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialName={initialCreateName}
        initialUrl={initialCreateUrl}
        onSuccess={(newItem) => {
          setQrCodes((prev) => [newItem, ...prev]);
          setDownloadingItem(newItem); // Auto prompt download as requested
        }}
      />

      {/* 2. Modal: Editar Destino do QR Code */}
      <EditQRModal
        isOpen={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={(updated) => {
          setQrCodes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          setEditingItem(null);
        }}
      />

      {/* 3. Modal: Baixar QR Code (PNG / SVG com opção de nome abaixo) */}
      <DownloadQRModal
        isOpen={downloadingItem !== null}
        item={downloadingItem}
        onClose={() => setDownloadingItem(null)}
      />

      {/* 4. Modal: Exclusão Segura */}
      <DeleteConfirmModal
        isOpen={deletingItem !== null}
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onDeactivate={handleDeactivateFromModal}
        onDeletePermanently={handleDeletePermanent}
      />

      {/* 5. Modal: Minha Conta */}
      <AccountModal
        isOpen={isAccountOpen}
        user={user}
        onClose={() => setIsAccountOpen(false)}
        onLogout={handleLogout}
      />

      {/* 6. Modal: Informações de Placa & NFC */}
      <NfcModal
        isOpen={isNfcOpen}
        onClose={() => setIsNfcOpen(false)}
      />
    </div>
  );
}
