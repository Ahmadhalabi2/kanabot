import { useState } from 'react';
import { X } from 'lucide-react';
import { sprints as sprintsApi, ai as aiApi } from '../../lib/api';
import type { Sprint } from '../../types/api';
import { Spinner } from '../ui/Spinner';
import { ModalOverlay } from '../ui/ModalOverlay';
import { useLang } from '../../context/LanguageContext';

interface Props {
  sprint: Sprint;
  plannedSprints: Sprint[];
  open: boolean;
  onClose: () => void;
  onCompleted: (s: Sprint) => void;
}

export function CompleteSprintModal({ sprint, plannedSprints, open, onClose, onCompleted }: Props) {
  const { t } = useLang();
  const [moveUnfinishedTo, setMoveUnfinishedTo] = useState<string>('backlog');
  const [generateSummary, setGenerateSummary]   = useState(true);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState('');

  const doneTodos   = sprint.stats.doneTodos;
  const totalTodos  = sprint.stats.totalTodos;
  const notFinished = totalTodos - doneTodos;
  const donePoints  = sprint.stats.donePoints;
  const totalPoints = sprint.stats.totalPoints;

  const handleComplete = async () => {
    setError(''); setLoading(true);
    try {
      const completed = await sprintsApi.complete(sprint.id, { moveUnfinishedTo });
      if (generateSummary) {
        try { await aiApi.summarizeSprint(sprint.id); } catch { /* non-fatal */ }
      }
      onCompleted(completed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.ai.completeFailed);
    } finally { setLoading(false); }
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="bg-white dark:bg-surface-700 rounded-2xl shadow-2xl w-full max-w-md"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-surface-600">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t.ai.completeTitle(sprint.name)}</h2>
          <button className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-0.5">
              {t.ai.doneTodosMsg(doneTodos, notFinished)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.ai.pointsCompleted(donePoints, totalPoints)}</p>
          </div>

          {notFinished > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.ai.moveUnfinishedTo}</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer py-2">
                  <input type="radio" name="moveTo" value="backlog" checked={moveUnfinishedTo === 'backlog'} onChange={() => setMoveUnfinishedTo('backlog')} className="accent-gray-900" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.ai.backlogOption}</span>
                </label>
                {plannedSprints.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer py-2">
                    <input type="radio" name="moveTo" value={s.id} checked={moveUnfinishedTo === s.id} onChange={() => setMoveUnfinishedTo(s.id)} className="accent-gray-900" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-surface-600 pt-4">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={generateSummary} onChange={(e) => setGenerateSummary(e.target.checked)} className="mt-0.5 accent-gray-900" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.ai.generateAiSummary}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.ai.aiSummaryHint}</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-surface-600">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>{t.common.cancel}</button>
          <button className="btn-primary" onClick={handleComplete} disabled={loading}>
            {loading ? <Spinner size="sm" /> : null} {t.sprints.completeSprint}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
