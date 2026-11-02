import { Modal } from './Modal';
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
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
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
    </Modal>
  );
}
