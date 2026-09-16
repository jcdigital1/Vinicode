import React, { useState, useEffect } from 'react';
import {
  Star,
  Search,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
  Trash2,
  HelpCircle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { GoogleBusiness } from '../types.ts';

interface GoogleReviewSectionProps {
  onOpenCreateQRWithData: (name: string, destinationUrl: string) => void;
  onNavigateToQRs: () => void;
}

interface FoundPlace {
  businessName: string;
  address: string;
  city: string;
  placeId: string;
  reviewUrl: string;
}

export const GoogleReviewSection: React.FC<GoogleReviewSectionProps> = ({
  onOpenCreateQRWithData,
  onNavigateToQRs,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flow states: 'input' -> 'confirming' -> 'success'
  const [flowState, setFlowState] = useState<'input' | 'confirming' | 'success'>('input');
  const [foundPlace, setFoundPlace] = useState<FoundPlace | null>(null);
  const [copied, setCopied] = useState(false);

  // Minhas Empresas list
  const [savedBusinesses, setSavedBusinesses] = useState<GoogleBusiness[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const loadSaved = async () => {
    setLoadingSaved(true);
    try {
      const res = await api.getGoogleBusinesses();
      setSavedBusinesses(res.businesses);
    } catch (err) {
      console.error('Error loading businesses:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const query = inputQuery.trim();
    if (!query) {
      setError('Cole o link ou digite o nome da empresa no Google Maps');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resolveGoogleBusiness(query);
      if (!res.place) {
        throw new Error('Não foi possível localizar o estabelecimento no Google');
      }
      setFoundPlace(res.place);
      setFlowState('confirming');
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar estabelecimento. Tente colar o link completo ou o nome da empresa.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompany = async () => {
    if (!foundPlace) return;
    setLoading(true);
    try {
      // Save to Minhas Empresas
      await api.saveGoogleBusiness({
        businessName: foundPlace.businessName,
        address: foundPlace.address,
        city: foundPlace.city,
        placeId: foundPlace.placeId,
        reviewUrl: foundPlace.reviewUrl,
      });
      await loadSaved();
      setFlowState('success');
    } catch (err) {
      console.error('Error saving business:', err);
      // Still show success view so user can copy/create QR
      setFlowState('success');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await api.deleteGoogleBusiness(id);
      setSavedBusinesses((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Error deleting business:', err);
    }
  };

  const handleCreateQRFromReview = () => {
    if (!foundPlace) return;
    onOpenCreateQRWithData(
      `Avaliação Google — ${foundPlace.businessName}`,
      foundPlace.reviewUrl
    );
  };

  return (
    <div id="section-google-review-generator" className="space-y-6">
      {/* Main Generator Card */}
      <div className="bg-[#141417] border border-zinc-800/90 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              GERADOR DE LINK PARA AVALIAÇÃO GOOGLE
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Cole o link da empresa no Google e gere um acesso direto para seus clientes deixarem uma avaliação 5 estrelas.
            </p>
          </div>
        </div>

        {/* STEP 1: INPUT LINK OU NOME */}
        {flowState === 'input' && (
          <form onSubmit={handleResolve} className="mt-5 space-y-4">
            {error && (
              <div className="p-3.5 bg-red-950/50 border border-red-800/70 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="google-maps-input"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2"
              >
                LINK DA EMPRESA NO GOOGLE OU NOME DO ESTABELECIMENTO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Search className="w-4 h-4 text-amber-500" />
                </div>
                <input
                  id="google-maps-input"
                  type="text"
                  placeholder="Cole aqui o link compartilhado do Google/Google Maps ou nome da empresa"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-400 outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                Aceita links como <strong>maps.app.goo.gl/...</strong>, <strong>google.com/maps/...</strong> ou nome + cidade da sua empresa.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                id="btn-generate-review-link"
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Localizando empresa no Google...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-white" />
                    <span>⭐ GERAR LINK DE AVALIAÇÃO</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: CONFIRMAR EMPRESA (Section 20) */}
        {flowState === 'confirming' && foundPlace && (
          <div
            id="google-confirm-company-box"
            className="mt-5 p-5 bg-[#0c0c0e] border border-amber-500/30 rounded-xl space-y-4 animate-in fade-in"
          >
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>⭐ EMPRESA ENCONTRADA</span>
            </div>

            <div className="space-y-2.5 bg-[#141417] p-4 rounded-lg border border-zinc-800">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-zinc-400 block">Nome:</span>
                  <span className="text-base font-bold text-white leading-tight">
                    {foundPlace.businessName}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-zinc-400 block">Endereço:</span>
                  <span className="text-xs text-zinc-300">
                    {foundPlace.address}
                  </span>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    {foundPlace.city}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <span>Place ID:</span>
                <span className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                  {foundPlace.placeId}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Confirme se este é o estabelecimento correto antes de gerar a plaquinha ou link permanente.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setFlowState('input')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>PROCURAR NOVAMENTE</span>
              </button>

              <button
                id="btn-confirm-correct-business"
                type="button"
                onClick={handleConfirmCompany}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>✓ É ESTA EMPRESA</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RESULTADO DO GOOGLE (Section 21, 22, 23) */}
        {flowState === 'success' && foundPlace && (
          <div
            id="google-review-result-box"
            className="mt-5 p-5 bg-[#0c0c0e] border border-emerald-500/40 rounded-xl space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Check className="w-4 h-4" />
                <span>✓ LINK DE AVALIAÇÃO CRIADO COM SUCESSO</span>
              </div>
              <button
                onClick={() => {
                  setFlowState('input');
                  setInputQuery('');
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Novo Link
              </button>
            </div>

            <div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{foundPlace.businessName}</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">{foundPlace.address}</div>
            </div>

            {/* Direct Link box */}
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">
                Link Oficial Direto (Abre diretamente a janela de avaliar no Google):
              </span>
              <div className="p-3 bg-[#141417] border border-zinc-800 rounded-xl flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-xs font-mono text-zinc-300 truncate">
                  {foundPlace.reviewUrl}
                </span>
                <button
                  id="btn-copy-review-url"
                  onClick={() => handleCopy(foundPlace.reviewUrl)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>COPIAR</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons: Copiar, Testar, Criar QR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={() => handleCopy(foundPlace.reviewUrl)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>📋 COPIAR LINK</span>
              </button>

              <a
                id="btn-test-google-review-link"
                href={foundPlace.reviewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>↗ TESTAR LINK</span>
              </a>

              {/* 23. AVALIAÇÃO GOOGLE → QR CODE */}
              <button
                id="btn-create-qr-from-google"
                onClick={handleCreateQRFromReview}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-lg shadow-red-950/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>▦ CRIAR QR CODE</span>
              </button>
            </div>

            {/* Section 24: Experiência da Plaquinha Google */}
            <div className="p-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-xs space-y-1">
              <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Experiência da Plaquinha VINI CODE:</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Ao criar o QR Code acima, o cliente aponta a câmera da placa → o VINI CODE faz o redirect invisível em milissegundos → abre diretamente a tela do Google para o cliente dar 5 estrelas e elogiar sua empresa.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 25: MINHAS EMPRESAS */}
      <div id="section-my-businesses" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              MINHAS EMPRESAS SALVAS
            </h3>
          </div>
          <span className="text-xs text-zinc-400">
            {savedBusinesses.length} {savedBusinesses.length === 1 ? 'empresa' : 'empresas'}
          </span>
        </div>

        {loadingSaved ? (
          <div className="p-6 bg-[#141417] rounded-xl border border-zinc-800 text-center text-xs text-zinc-400 animate-pulse">
            Carregando empresas cadastradas...
          </div>
        ) : savedBusinesses.length === 0 ? (
          <div className="p-6 bg-[#141417] rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-400">
            Nenhuma empresa salva ainda. Use o gerador acima para salvar e vincular seu negócio ao VINI CODE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedBusinesses.map((biz) => (
              <div
                key={biz.id}
                id={`business-card-${biz.id}`}
                className="bg-[#141417] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="truncate">{biz.businessName}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded font-medium shrink-0">
                      Google Configurado
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-1 truncate">
                    {biz.address || biz.city}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {/* Copy Link */}
                    <button
                      onClick={() => handleCopy(biz.reviewUrl)}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                      title="Copiar link de avaliação"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>

                    {/* Test */}
                    <a
                      href={biz.reviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                      title="Abrir página de avaliação no Google"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Testar</span>
                    </a>

                    {/* Gerar / Ver QR */}
                    <button
                      onClick={() =>
                        onOpenCreateQRWithData(
                          `Avaliação Google — ${biz.businessName}`,
                          biz.reviewUrl
                        )
                      }
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 font-medium transition-colors"
                      title="Criar ou visualizar QR dinâmico"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Gerar QR</span>
                    </button>
                  </div>

                  {/* Excluir da lista */}
                  <button
                    onClick={() => handleDeleteSaved(biz.id)}
                    className="text-zinc-400 hover:text-red-400 p-1 transition-colors"
                    title="Remover empresa salva"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
