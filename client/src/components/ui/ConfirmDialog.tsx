import { AlertTriangle, Info } from 'lucide-react';
import { ModalOverlay } from './ModalOverlay';
import { Spinner } from './Spinner';
import { useLang } from '../../context/LanguageContext';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel, danger = false, loading = false,
}: ConfirmDialogProps) {
  const { t } = useLang();

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div
        className="bg-white dark:bg-surface-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured top stripe */}
        <div className={`h-1 w-full ${danger ? 'bg-red-500' : 'bg-brand-500'}`} />

        <div className="p-6">
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              danger
                ? 'bg-red-50 dark:bg-red-900/25 text-red-500'
                : 'bg-brand-50 dark:bg-brand-900/25 text-brand-500'
            }`}>
              {danger
                ? <AlertTriangle size={20} />
                : <Info size={20} />
              }
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t.common.cancel}
            </button>
            <button
              className={danger ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading && <Spinner size="sm" />}
              {confirmLabel ?? t.common.yes}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
