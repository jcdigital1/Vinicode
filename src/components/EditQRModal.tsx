import React, { useState, useEffect } from 'react';
import { X, Edit2, AlertCircle, Link as LinkIcon, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { QRCodeItem } from '../types.ts';

interface EditQRModalProps {
  item: QRCodeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: QRCodeItem) => void;
}

export const EditQRModal: React.FC<EditQRModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDestinationUrl(item.destinationUrl);
      setActive(item.active);
      setError(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUrl = destinationUrl.trim();
    if (!cleanUrl) {
      setError('O link de destino não pode ficar vazio.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateQRCode(item.id, {
        name: name.trim() || item.name,
        destinationUrl: cleanUrl,
        active,
      });
      onSuccess(res.qrCode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar QR Code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-edit-qr"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-[#141417] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <Edit2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">
                EDITAR DESTINO DO QR CODE
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Altere para onde o QR Code aponta sem precisar reimprimir.
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

          {/* Permanent Slug Guarantee Notice */}
          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-white">
                Código Permanente Preservado: <span className="font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/50">{item.code}</span>
              </div>
              <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                A imagem do QR Code que você já baixou ou imprimiu <strong>NÃO MUDA</strong>. Ao salvar, qualquer pessoa que escanear a placa antiga será redirecionada para o novo destino automaticamente.
              </p>
            </div>
          </div>

          {/* Nome do QR Code */}
          <div>
            <label
              htmlFor="edit-qr-name"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Nome do QR Code
            </label>
            <input
              id="edit-qr-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all"
            />
          </div>

          {/* Novo Link de destino */}
          <div>
            <label
              htmlFor="edit-qr-destination"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Novo Link de destino
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                id="edit-qr-destination"
                type="text"
                required
                placeholder="Exemplo: https://youtube.com/@carlos"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-400 outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Status Switch */}
          <div className="pt-2 flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div>
              <div className="text-xs font-semibold text-white">Status do QR Code</div>
              <div className="text-[11px] text-zinc-400">
                {active ? '🟢 Ativo (redireciona visitantes normalmente)' : '⏸ Inativo (redirecionamento pausado)'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                active ? 'bg-emerald-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
              id="btn-submit-edit-qr"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-lg shadow-red-900/40 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SALVAR ALTERAÇÕES</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
