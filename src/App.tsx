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
  Loader2,
} from 'lucide-react';
import { QRCodeItem, User, DashboardStats as StatsType } from './types.ts';
import { api } from './services/api.ts';
import { authService } from './services/authService.ts';
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
import { Logo } from './components/Logo.tsx';

export default function App() {
  // --------------------------------------------------------------------------
  // 1. PUBLIC SCAN ROUTE: /q/[code] MUST NEVER REQUIRE LOGIN OR SHOW DASHBOARD
  // --------------------------------------------------------------------------
  const [publicScanCode] = useState<string | null>(() => {
    try {
      const path = window.location.pathname || '';
      if (path.startsWith('/q/')) {
        const candidate = path.split('/q/')[1]?.split('/')[0]?.split('?')[0];
        return candidate && candidate.trim().length > 0 ? candidate.trim().toUpperCase() : null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [publicScanLoading, setPublicScanLoading] = useState(Boolean(publicScanCode));
  const [publicScanError, setPublicScanError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicScanCode) return;

    let isMounted = true;
    setPublicScanLoading(true);

    api
      .getPublicQRDestination(publicScanCode)
      .then((res) => {
        if (!isMounted) return;
        if (!res) {
          setPublicScanError('QR Code não encontrado ou link inexistente.');
          setPublicScanLoading(false);
          return;
        }

        if (!res.active) {
          setPublicScanError('Este QR Code está temporariamente desativado pelo proprietário.');
          setPublicScanLoading(false);
          return;
        }

        // Instant direct redirection
        window.location.replace(res.destinationUrl);
      })
      .catch(() => {
        if (isMounted) {
          setPublicScanError('Não foi possível conectar ao servidor para carregar o destino.');
          setPublicScanLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [publicScanCode]);

  // If this is a public scan path (/q/:code), render public redirect interface
  if (publicScanCode) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6">
          <Logo size="md" showSlogan={false} />
        </div>
        <div className="w-full max-w-sm bg-[#141417] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {publicScanLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              <div className="text-sm text-zinc-300 font-medium">Redirecionando para o destino...</div>
              <div className="text-xs text-zinc-400">Código: {publicScanCode}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Aviso do QR Code</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">{publicScanError}</p>
              <button
                onClick={() => (window.location.href = '/')}
                className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 rounded-lg transition-colors"
              >
                Ir para o início
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATION & PRIVATE APPLICATION
  // --------------------------------------------------------------------------
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

  // Check initial user authentication via authService
  useEffect(() => {
    let isMounted = true;

    authService
      .getCurrentUser()
      .then((u) => {
        if (isMounted) setUser(u);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setAuthChecking(false);
      });

    const unsubscribe = authService.onAuthStateChange((u) => {
      if (isMounted) setUser(u);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
  const handleLogout = async () => {
    await authService.signOut();
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
      if (statusFilter === 'ACTIVE' && !item.active) return false;
      if (statusFilter === 'INACTIVE' && item.active) return false;

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

  // Deactivate from modal
  const handleDeactivateFromModal = async (item: QRCodeItem) => {
    try {
      const res = await api.updateQRCode(item.id, { active: false });
      setQrCodes((prev) => prev.map((q) => (q.id === item.id ? res.qrCode : q)));
      setDeletingItem(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao desativar QR Code');
    }
  };

  // If checking authentication, show brand loading screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <Logo size="lg" showSlogan={true} />
        <div className="mt-8 flex items-center gap-3 text-xs text-zinc-400">
          <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show Auth View
  if (!user) {
    return <AuthView onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />;
  }

  return (
    <div id="vini-code-app" className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        user={user}
        onOpenAccount={() => setIsAccountOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* VIEW 1: DASHBOARD GERAL */}
        {currentTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header with Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Painel de Controle
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Gerencie seus QR Codes dinâmicos, destinos e métricas de escaneamento em tempo real.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  id="dashboard-new-qr-btn"
                  onClick={() => {
                    setInitialCreateName('');
                    setInitialCreateUrl('');
                    setIsCreateOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo QR Code</span>
                </button>
              </div>
            </div>

            {/* Metrics cards */}
            <DashboardStats stats={stats} />

            {/* Quick Banner: Google Reviews */}
            <div className="bg-gradient-to-r from-red-950/40 via-[#141417] to-[#141417] border border-red-900/40 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                  <Star className="w-5 h-5 fill-red-500/30" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Gerador de Avaliação Google Direto
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold uppercase">
                      5 Estrelas
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Crie links que abrem a tela de avaliação do Google com 5 estrelas pré-selecionadas.
                    Ideal para placas físicas de balcão e mesas.
                  </p>
                </div>
              </div>

              <button
                id="banner-google-review-btn"
                onClick={() => setCurrentTab('google_review')}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <span>Acessar Gerador</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Recent QR Codes Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-red-500" />
                  <h2 className="text-base font-bold text-white">QR Codes Recentes</h2>
                </div>
                {qrCodes.length > 0 && (
                  <button
                    onClick={() => setCurrentTab('qrcodes')}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    Ver todos ({qrCodes.length}) →
                  </button>
                )}
              </div>

              {loadingQRs ? (
                <div className="text-center py-12 bg-[#141417] border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-zinc-400">Carregando seus QR Codes...</span>
                </div>
              ) : qrCodes.length === 0 ? (
                <div className="text-center py-12 bg-[#141417] border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Nenhum QR Code criado ainda</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
                    Crie seu primeiro QR Code dinâmico. O código é permanente e o link de destino pode
                    ser alterado a qualquer momento.
                  </p>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Primeiro QR Code</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qrCodes.slice(0, 4).map((item) => (
                    <QRCodeCard
                      key={item.id}
                      item={item}
                      onEdit={() => setEditingItem(item)}
                      onDownload={() => setDownloadingItem(item)}
                      onToggleStatus={() => handleToggleStatus(item)}
                      onDelete={() => setDeletingItem(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: GERENCIAMENTO COMPLETO DE QR CODES */}
        {currentTab === 'qrcodes' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Meus QR Codes Dinâmicos
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Todos os códigos possuem slug permanente. Você pode alterar o destino sem trocar o QR impresso.
                </p>
              </div>

              <button
                id="qrcodes-page-create-btn"
                onClick={() => {
                  setInitialCreateName('');
                  setInitialCreateUrl('');
                  setIsCreateOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Novo QR Code</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="qr-search-input"
                  type="text"
                  placeholder="Buscar por nome, código ou destino..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-zinc-400 outline-none transition-all"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#0c0c0e] p-1 border border-zinc-800 rounded-xl w-full sm:w-auto justify-center">
                <button
                  id="filter-all-btn"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos ({qrCodes.length})
                </button>
                <button
                  id="filter-active-btn"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Ativos ({stats.active})
                </button>
                <button
                  id="filter-inactive-btn"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Inativos ({stats.inactive})
                </button>
              </div>
            </div>

            {/* Grid of QR Codes */}
            {loadingQRs ? (
              <div className="text-center py-16 bg-[#141417] border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400">Carregando lista de QR Codes...</span>
              </div>
            ) : filteredQRCodes.length === 0 ? (
              <div className="text-center py-16 bg-[#141417] border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Nenhum QR Code encontrado</h3>
                <p className="text-xs text-zinc-400 max-w-sm mt-1">
                  {searchQuery
                    ? `Nenhum resultado corresponde à busca "${searchQuery}".`
                    : 'Você não possui QR Codes com este filtro.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQRCodes.map((item) => (
                  <QRCodeCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item)}
                    onDownload={() => setDownloadingItem(item)}
                    onToggleStatus={() => handleToggleStatus(item)}
                    onDelete={() => setDeletingItem(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: GERADOR DE AVALIAÇÃO GOOGLE */}
        {currentTab === 'google_review' && (
          <GoogleReviewSection
            onOpenCreateQR={handleOpenCreateWithData}
            onOpenNfcModal={() => setIsNfcOpen(true)}
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
              Sincronização em Nuvem Ativa
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
      <CreateQRModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialName={initialCreateName}
        initialUrl={initialCreateUrl}
        onSuccess={(newItem) => {
          setQrCodes((prev) => [newItem, ...prev]);
          setDownloadingItem(newItem);
        }}
      />

      <EditQRModal
        isOpen={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={(updated) => {
          setQrCodes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          setEditingItem(null);
        }}
      />

      <DownloadQRModal
        isOpen={downloadingItem !== null}
        item={downloadingItem}
        onClose={() => setDownloadingItem(null)}
      />

      <DeleteConfirmModal
        isOpen={deletingItem !== null}
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onDeactivate={handleDeactivateFromModal}
        onDeletePermanently={handleDeletePermanent}
      />

      <AccountModal
        isOpen={isAccountOpen}
        user={user}
        onClose={() => setIsAccountOpen(false)}
        onLogout={handleLogout}
      />

      <NfcModal isOpen={isNfcOpen} onClose={() => setIsNfcOpen(false)} />
    </div>
  );
}
