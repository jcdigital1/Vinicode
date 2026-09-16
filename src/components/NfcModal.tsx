import React from 'react';
import { X, Radio, Smartphone, QrCode, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { getDynamicRedirectUrl } from '../utils/qrRenderer.ts';

interface NfcModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode?: string;
}

export const NfcModal: React.FC<NfcModalProps> = ({ isOpen, onClose, selectedCode }) => {
  if (!isOpen) return null;

  const exampleUrl = selectedCode
    ? getDynamicRedirectUrl(selectedCode)
    : `${window.location.origin}/q/AB7K92X`;

  return (
    <div
      id="modal-nfc-info"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-[#141417] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-500">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                ARQUITETURA DUAL: PLACA QR + CHIP NFC
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Mesmo link inteligente para aproximação e escaneamento
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
          <div className="p-3.5 bg-[#0c0c0e] border border-zinc-800 rounded-xl space-y-2">
            <div className="text-zinc-200 font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-red-500" />
              <span>Como configurar placas com tecnologia NFC:</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              O VINI CODE foi desenhado para unificar totens e plaquinhas físicas. Você grava a mesma URL dinâmica permanente no chip NFC (usando qualquer aplicativo como NFC Tools no celular):
            </p>
            <div className="p-2.5 bg-zinc-900 font-mono text-[11px] text-red-400 rounded-lg border border-zinc-800 break-all select-all">
              {exampleUrl}
            </div>
          </div>

          {/* Diagram */}
          <div className="grid grid-cols-3 gap-2 text-center p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/70">
            <div className="flex flex-col items-center">
              <QrCode className="w-6 h-6 text-zinc-300 mb-1" />
              <span className="font-bold text-zinc-200 text-[11px]">QR Impresso</span>
              <span className="text-[10px] text-zinc-400">Escaneou</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <ArrowRight className="w-4 h-4 text-red-500 mb-1" />
              <span className="font-mono text-[10px] text-red-400">/q/CODE</span>
              <span className="text-[9px] text-emerald-400">Redirect 302</span>
            </div>
            <div className="flex flex-col items-center">
              <Radio className="w-6 h-6 text-zinc-300 mb-1" />
              <span className="font-bold text-zinc-200 text-[11px]">Tag NFC</span>
              <span className="text-[10px] text-zinc-400">Aproximou</span>
            </div>
          </div>

          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              Ao alterar o destino no painel do VINI CODE, <strong>tanto o QR Code quanto a aproximação NFC passam a abrir o novo destino instantaneamente</strong> sem precisar reprogramar o chip ou reimprimir a placa!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
