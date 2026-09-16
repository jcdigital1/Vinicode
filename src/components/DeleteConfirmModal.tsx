import React from 'react';
import { AlertTriangle, X, PauseCircle, Trash2 } from 'lucide-react';
import { QRCodeItem } from '../types.ts';

interface DeleteConfirmModalProps {
  item: QRCodeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeactivate: (item: QRCodeItem) => void;
  onDeletePermanently: (item: QRCodeItem) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  item,
  isOpen,
  onClose,
  onDeactivate,
  onDeletePermanently,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div
      id="modal-delete-confirm"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-[#141417] border border-red-950/80 rounded-2xl shadow-2xl shadow-red-950/40 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              EXCLUIR QR CODE?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="text-sm font-semibold text-zinc-100">
            {item.name}
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Se este QR Code já estiver impresso em placas, cartões ou adesivos, <strong>ele poderá deixar de funcionar</strong> permanentemente.
          </p>

          <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-xs text-red-300">
            Você pode apenas <strong>DESATIVAR</strong> temporariamente para manter o registro e reativar quando quiser.
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer order-3 sm:order-1"
          >
            CANCELAR
          </button>

          <button
            id="btn-confirm-deactivate"
            type="button"
            onClick={() => onDeactivate(item)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer order-2"
          >
            <PauseCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>DESATIVAR</span>
          </button>

          <button
            id="btn-confirm-delete-permanent"
            type="button"
            onClick={() => onDeletePermanently(item)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-600 rounded-xl shadow-lg shadow-red-950/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer order-1 sm:order-3"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>EXCLUIR PERMANENTEMENTE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
