import React, { useState, useEffect } from 'react';
import { Edit3, Download, ExternalLink, Trash2, Eye, Calendar, Copy, Check, Radio } from 'lucide-react';
import { QRCodeItem } from '../types.ts';
import { generateQRCodeDataUrl, getDynamicRedirectUrl } from '../utils/qrRenderer.ts';

interface QRCodeCardProps {
  item: QRCodeItem;
  onEdit: (item: QRCodeItem) => void;
  onDownload: (item: QRCodeItem) => void;
  onDelete: (item: QRCodeItem) => void;
  onToggleStatus: (item: QRCodeItem) => void;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  item,
  onEdit,
  onDownload,
  onDelete,
  onToggleStatus,
}) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const dynamicUrl = getDynamicRedirectUrl(item.code);

  useEffect(() => {
    let active = true;
    generateQRCodeDataUrl(dynamicUrl, 120).then((url) => {
      if (active) setQrSrc(url);
    });
    return () => {
      active = false;
    };
  }, [dynamicUrl]);

  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(dynamicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Nenhuma ainda';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data indisponível';
    }
  };

  // Truncate URL neatly
  const displayUrl = item.destinationUrl.replace(/^https?:\/\//, '');

  return (
    <div
      id={`qr-card-${item.id}`}
      className="group relative bg-[#141417] hover:bg-[#18181c] transition-all duration-200 border border-zinc-800/80 hover:border-red-900/50 rounded-xl p-3.5 sm:p-4 shadow-md shadow-black/20 flex flex-col justify-between"
    >
      <div className="flex gap-3.5 items-start">
        {/* QR Thumbnail (80-90px) with subtle rounded container */}
        <div
          onClick={() => onDownload(item)}
          className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white p-1.5 rounded-lg shrink-0 flex items-center justify-center cursor-pointer shadow-inner group/thumb"
          title="Clique para baixar ou ampliar"
        >
          {qrSrc ? (
            <img
              src={qrSrc}
              alt={`QR Code ${item.name}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-zinc-200 animate-pulse rounded" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white">
            <Download className="w-5 h-5" />
          </div>
        </div>

        {/* Content details */}
        <div className="flex-1 min-w-0">
          {/* Header with Title & Status Badge */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-bold text-white text-base leading-snug truncate"
              title={item.name}
            >
              {item.name}
            </h3>

            {/* Status toggle pill */}
            <button
              id={`status-toggle-${item.id}`}
              onClick={() => onToggleStatus(item)}
              title={item.active ? 'Clique para desativar' : 'Clique para ativar'}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                item.active
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/60'
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  item.active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                }`}
              />
              {item.active ? 'Ativo' : 'Inativo'}
            </button>
          </div>

          {/* Permanent Code slug */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Código:
            </span>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded border border-red-900/40">
              {item.code}
            </span>
            <button
              onClick={copyUrl}
              className="text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 transition-colors"
              title="Copiar link dinâmico de produção"
            >
              {copied ? (
                <span className="text-emerald-400 flex items-center gap-0.5 text-[11px]">
                  <Check className="w-3 h-3" /> Copiado
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[11px]">
                  <Copy className="w-3 h-3" /> Copiar Link
                </span>
              )}
            </button>
          </div>

          {/* Destination URL (Truncated, no overflow) */}
          <div className="mt-1.5 flex items-center gap-1 text-xs text-zinc-300">
            <span className="text-zinc-400 shrink-0">Destino:</span>
            <a
              href={item.destinationUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-zinc-200 hover:text-red-400 underline decoration-zinc-700 hover:decoration-red-400 transition-colors"
              title={item.destinationUrl}
            >
              {displayUrl}
            </a>
          </div>

          {/* Statistics summary */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold text-zinc-200">{item.scanCount}</span>
              <span>leituras</span>
            </div>
            {item.lastScannedAt && (
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                <Calendar className="w-3 h-3 text-zinc-400" />
                <span>Última: {formatDate(item.lastScannedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar (Compact, clearly organized) */}
      <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {/* Edit */}
          <button
            id={`btn-edit-${item.id}`}
            onClick={() => onEdit(item)}
            className="px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Editar</span>
          </button>

          {/* Download */}
          <button
            id={`btn-download-${item.id}`}
            onClick={() => onDownload(item)}
            className="px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Baixar</span>
          </button>

          {/* Test Link (Simulates scanning the real dynamic URL) */}
          <a
            id={`btn-test-${item.id}`}
            href={dynamicUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-red-300 bg-zinc-800/60 hover:bg-red-950/40 border border-transparent hover:border-red-900/30 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
            title="Acessar o link dinâmico (registra leitura e redireciona)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-red-400" />
            <span>Testar</span>
          </a>
        </div>

        {/* Delete */}
        <button
          id={`btn-delete-${item.id}`}
          onClick={() => onDelete(item)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
          title="Excluir QR Code"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
