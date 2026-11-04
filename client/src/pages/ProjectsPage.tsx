import { useEffect, useState } from 'react';
// import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, ArrowRight, Layers, Zap, FolderKanban, X } from 'lucide-react';
import { projects as projectsApi } from '../lib/api';
import type { ProjectWithStats } from '../types/api';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { useLang } from '../context/LanguageContext';

function ProjectForm({
  initial, onSubmit, onCancel,
}: {
  initial?: Partial<ProjectWithStats>;
  onSubmit: (d: { name: string; key?: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useLang();
  const [form, setForm] = useState({ name: initial?.name ?? '', key: initial?.key ?? '', description: initial?.description ?? '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<{ general?: string; key?: string; name?: string }>({});
  const set = (f: string, v: string) => { setForm((p) => ({ ...p, [f]: v })); setErrors((e) => ({ ...e, [f]: undefined })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: t.projects.nameRequired }); return; }
    setLoading(true);
    setErrors({});
    try {
      await onSubmit({ name: form.name.trim(), key: form.key.trim() || undefined, description: form.description.trim() || undefined });
    } catch (err: unknown) {
      const status  = (err as { status?: number }).status;
      const message = err instanceof Error ? err.message : t.common.error;
      // 409 on key conflict — show under the key field
      if (status === 409) { setErrors({ key: 'This key is already used by another project.' }); }
      else { setErrors({ general: message }); }
    }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {errors.general && <p className="text-sm text-red-500 dark:text-red-400">{errors.general}</p>}
      <div>
        <label className="label">{t.projects.projectName}</label>
        <input className="input" autoFocus required maxLength={80} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t.projects.projectNamePlaceholder} />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>
      <div>
        <label className="label">{t.projects.key} <span className="text-gray-400 font-normal text-xs">{t.projects.keyHint}</span></label>
        <input className={`input uppercase font-mono tracking-widest ${errors.key ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
               maxLength={6} value={form.key} onChange={(e) => set('key', e.target.value.toUpperCase())} placeholder={t.projects.keyPlaceholder} />
        {errors.key && <p className="field-error">{errors.key}</p>}
      </div>
      <div>
        <label className="label">{t.projects.description}</label>
        <textarea className="input resize-none" rows={3} maxLength={500} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={t.projects.descriptionPlaceholder} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <Spinner size="sm" />}
          {initial?.id ? t.projects.saveChanges : t.projects.createProject}
        </button>
      </div>
    </form>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { t }   = useLang();
  const toast   = useToast();
  const [list, setList]         = useState<ProjectWithStats[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<ProjectWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithStats | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => { projectsApi.list().then(setList).finally(() => setLoading(false)); }, []);

  const filtered = list.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (d: Parameters<typeof projectsApi.create>[0]) => {
    const p = await projectsApi.create(d);
    setList((prev) => [p, ...prev]);
    setCreateOpen(false);
    toast.success('Project created!');
  };
  const handleUpdate = async (d: Parameters<typeof projectsApi.update>[1]) => {
    if (!editTarget) return;
    const updated = await projectsApi.update(editTarget.id, d);
    setList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditTarget(null);
    toast.success('Project updated!');
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteTarget.id);
      setList((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Project deleted.');
    } finally { setDeleting(false); }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="page-header sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <FolderKanban size={18} className="text-gray-400" />
          <h1 className="page-title">{t.projects.title}</h1>
          <span className="badge bg-gray-100 dark:bg-surface-600 text-gray-500 dark:text-gray-400">{list.length}</span>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> {t.projects.newProject}
        </button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {list.length > 0 && (
          <div className="relative max-w-xs mb-6">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.projects.searchPlaceholder} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center border border-brand-100 dark:border-brand-900/40">
              <FolderKanban size={24} className="text-brand-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{t.projects.noProjects}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.projects.noProjectsHint}</p>
            </div>
            <button className="btn-primary mt-2" onClick={() => setCreateOpen(true)}><Plus size={15} /> {t.projects.newProject}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}/backlog`)}
                className="card p-5 cursor-pointer group hover:border-brand-300 dark:hover:border-brand-700/60 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center
                                    bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400
                                    font-bold text-xs font-mono border border-brand-100 dark:border-brand-900/60">
                      {p.key.slice(0, 3)}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{p.name}</h2>
                      {p.stats.activeSprint ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{p.stats.activeSprint.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 mt-0.5 block">{t.projects.noActiveSprint}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditTarget(p); }} className="btn-ghost w-7 h-7 p-0 rounded-lg" title="Edit"><Pencil size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }} className="btn-ghost w-7 h-7 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
                {p.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">{p.description}</p>}
                <div className="border-t border-gray-100 dark:border-surface-600 pt-3 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><Layers size={11} />{p.stats.backlogCount} {t.projects.backlog}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><Zap size={11} />{p.stats.totalTodos} todos</span>
                  <ArrowRight size={13} className="ml-auto text-gray-300 dark:text-surface-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
            <button
              onClick={() => setCreateOpen(true)}
              className="min-h-[130px] rounded-xl border-2 border-dashed border-gray-200 dark:border-surface-600
                         hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-950/10
                         flex flex-col items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500
                         hover:text-brand-600 dark:hover:text-brand-400 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-surface-500 group-hover:border-brand-400 dark:group-hover:border-brand-600 flex items-center justify-center transition-colors">
                <Plus size={15} />
              </div>
              {t.projects.newProject}
            </button>
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t.projects.createProject}>
        <ProjectForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={t.projects.editProject}>
        {editTarget && <ProjectForm initial={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} />}
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={t.projects.deleteProject} message={t.projects.deleteConfirm(deleteTarget?.name ?? '')}
        confirmLabel={t.common.delete} danger loading={deleting} />
    </div>
  );
}
