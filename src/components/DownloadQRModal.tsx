import React, { useState, useEffect } from 'react';
import { X, Download, Check, Sparkles, Image as ImageIcon, FileCode, CheckSquare, Square } from 'lucide-react';
import { QRCodeItem } from '../types.ts';
import { generateQRCodeDataUrl, getDynamicRedirectUrl, downloadQRCode } from '../utils/qrRenderer.ts';

interface DownloadQRModalProps {
  item: QRCodeItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadQRModal: React.FC<DownloadQRModalProps> = ({ item, isOpen, onClose }) => {
  const [includeName, setIncludeName] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState<'png' | 'svg' | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      const dynamicUrl = getDynamicRedirectUrl(item.code);
      generateQRCodeDataUrl(dynamicUrl, 280).then((url) => {
        setPreviewSrc(url);
      });
      setDownloaded(false);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const dynamicUrl = getDynamicRedirectUrl(item.code);

  const handleDownload = async (format: 'png' | 'svg') => {
    setDownloadingFormat(format);
    try {
      await downloadQRCode({
        code: item.code,
        name: item.name,
        includeName,
        format,
      });
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3500);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div
      id="modal-download-qr"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-[#141417] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-500">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-none">
                BAIXAR QR CODE DINÂMICO
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1">
                Pronto para impressão em alta resolução ou corte vetorial
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

        {/* QR Preview Section */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#09090b]">
          <div
            id="qr-download-visual-preview"
            className="bg-white p-4 rounded-xl shadow-xl border border-zinc-200 flex flex-col items-center justify-center transition-all"
            style={{ width: '220px' }}
          >
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={item.name}
                className="w-44 h-44 object-contain"
              />
            ) : (
              <div className="w-44 h-44 bg-zinc-200 animate-pulse rounded" />
            )}

            {/* Nome abaixo do QR Code se habilitado */}
            {includeName && (
              <div className="mt-2 text-center text-xs font-bold text-zinc-900 truncate max-w-[190px] pt-1 border-t border-zinc-100">
                {item.name}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
            <span>Código permanente:</span>
            <span className="font-mono font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50">
              {item.code}
            </span>
          </div>
        </div>

        {/* Options & Formats */}
        <div className="p-5 space-y-4">
          {/* Checkbox: Mostrar nome abaixo do QR Code */}
          <div
            onClick={() => setIncludeName(!includeName)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0c0c0e] border border-zinc-800 hover:border-zinc-700 cursor-pointer select-none transition-colors"
          >
            <button
              type="button"
              className="text-red-500 focus:outline-none"
            >
              {includeName ? (
                <CheckSquare className="w-4 h-4 fill-red-600/20 text-red-500" />
              ) : (
                <Square className="w-4 h-4 text-zinc-500" />
              )}
            </button>
            <div className="text-xs">
              <span className="font-medium text-white">
                Mostrar nome abaixo do QR Code
              </span>
              <p className="text-[11px] text-zinc-400">
                Imprime o título centralizado e legível na parte inferior da imagem
              </p>
            </div>
          </div>

          {/* Guarantee pill */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Garantia VINI CODE:</strong> Este mesmo arquivo baixado continuará abrindo qualquer novo destino que você configurar futuramente no painel.
          </div>

          {downloaded && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-1.5 font-medium animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Download concluído com sucesso!</span>
            </div>
          )}

          {/* Download Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* PNG */}
            <button
              id="btn-download-png"
              onClick={() => handleDownload('png')}
              disabled={downloadingFormat !== null}
              className="p-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 font-bold text-xs text-white shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              <span>
                {downloadingFormat === 'png' ? 'Gerando...' : 'BAIXAR PNG'}
              </span>
            </button>

            {/* SVG */}
            <button
              id="btn-download-svg"
              onClick={() => handleDownload('svg')}
              disabled={downloadingFormat !== null}
              className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 font-bold text-xs text-zinc-200 hover:text-white border border-zinc-700/80 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileCode className="w-4 h-4 text-zinc-300" />
              <span>
                {downloadingFormat === 'svg' ? 'Gerando...' : 'BAIXAR SVG'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
