import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function ErrorState({ message = 'Something went wrong.', onRetry, fullPage = true }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 text-center p-8 ${fullPage ? 'flex-1' : 'py-16'}`}>
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle size={22} className="text-red-500 dark:text-red-400" />
      </div>
      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-200">Failed to load</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary gap-2">
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
