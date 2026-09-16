import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Link as LinkIcon, HelpCircle } from 'lucide-react';
import { api } from '../services/api.ts';
import { QRCodeItem } from '../types.ts';

interface CreateQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: QRCodeItem) => void;
  initialName?: string;
  initialUrl?: string;
  initialType?: 'custom' | 'google_review' | 'nfc_ready';
}

export const CreateQRModal: React.FC<CreateQRModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
  initialUrl = '',
  initialType = 'custom',
}) => {
  const [name, setName] = useState(initialName);
  const [destinationUrl, setDestinationUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if initial props change
  React.useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDestinationUrl(initialUrl);
      setError(null);
    }
  }, [isOpen, initialName, initialUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUrl = destinationUrl.trim();
    if (!cleanUrl) {
      setError('Por favor, informe o link de destino.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createQRCode(
        name.trim() || 'Meu QR Code Dinâmico',
        cleanUrl,
        (initialType as 'custom' | 'google_review' | 'nfc_ready') || 'custom'
      );
      onSuccess(res.qrCode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar QR Code dinâmico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-create-qr"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-[#141417] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">
                CRIAR QR CODE DINÂMICO
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Gera um link permanente que você poderá alterar a qualquer momento.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome do QR Code */}
          <div>
            <label
              htmlFor="create-qr-name"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Nome do QR Code
            </label>
            <input
              id="create-qr-name"
              type="text"
              placeholder="Exemplo: Instagram — Cliente João"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
            />
          </div>

          {/* Link de destino */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="create-qr-destination"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
              >
                Link de destino
              </label>
              <span className="text-[11px] text-zinc-400">Normalização automática</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                id="create-qr-destination"
                type="text"
                required
                placeholder="Exemplo: https://instagram.com/cliente"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              Se digitar &quot;instagram.com/cliente&quot;, converteremos para &quot;https://instagram.com/cliente&quot;.
            </p>
          </div>

          {/* Golden Rule Notice */}
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs space-y-1">
            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Como funciona a mágica do QR dinâmico:</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Será gerado um <strong>código permanente exclusivo</strong>. Ao escanear, o visitante é redirecionado instantaneamente para seu destino sem telas intermediárias. Mais tarde, você pode editar o destino quantas vezes quiser sem precisar trocar o QR Code impresso.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-create-qr"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-lg shadow-red-900/40 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <span>GERAR QR CODE DINÂMICO</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
