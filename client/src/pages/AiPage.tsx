import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles, Zap, RotateCcw, Plus, Bot, ChevronDown, Check } from 'lucide-react';
import { ai as aiApi, sprints as sprintsApi, todos as todosApi } from '../lib/api';
import type { ChatMessage, DraftTodo, Sprint, AiStatusResponse, PlanSprintResponse } from '../types/api';
import { TODO_TYPES, TODO_PRIORITIES, STORY_POINTS } from '../types/api';
import { Spinner } from '../components/ui/Spinner';
import { useLang } from '../context/LanguageContext';

type Tab = 'chat' | 'generate' | 'plan' | 'summary';

// ── Custom Select ──────────────────────────────────────────────────────
function CustomSelect({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left cursor-pointer w-full"
      >
        <span className="truncate">{selected?.label ?? '—'}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-violet-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[100] mt-1.5 w-full rounded-xl border border-violet-200 dark:border-surface-600
                        bg-white dark:bg-surface-800 shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left
                         transition-colors duration-100
                         ${opt.value === value
                           ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                           : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-700'
                         }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check size={13} className="shrink-0 text-violet-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chat Tab ──────────────────────────────────────────────────────────
function ChatTab({ projectId, messages, setMessages }: {
  projectId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}) {
  const { t } = useLang();
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const res = await aiApi.chat(projectId, history);
      setMessages((m) => [...m, res.message]);
    } catch (err: unknown) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${err instanceof Error ? err.message : t.common.error}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[560px]">
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white dark:bg-surface-850">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <Bot size={36} className="text-gray-300 dark:text-gray-600" />
            <p className="font-medium text-gray-600 dark:text-gray-400">{t.ai.chatEmpty}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">{t.ai.chatEmptyHint}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-surface-700 flex items-center justify-center text-xs shrink-0 mt-0.5">✦</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-br-sm'
                : 'bg-gray-100 text-gray-800 dark:bg-surface-700 dark:text-gray-200 rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-surface-700 flex items-center justify-center text-xs shrink-0">✦</div>
            <div className="bg-gray-100 dark:bg-surface-700 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-400 flex items-center gap-1.5">
              {t.ai.thinking}{' '}
              {[0,1,2].map((j) => (
                <span key={j} className="w-1 h-1 bg-gray-400 rounded-full animate-bounce inline-block" style={{ animationDelay: `${j * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-surface-600 p-3 flex gap-2 bg-white dark:bg-surface-850">
        <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.ai.chatPlaceholder} disabled={loading} />
        <button type="submit" className="btn-primary px-4" disabled={!input.trim() || loading}>
          {loading ? <Spinner size="sm" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
}

// ── Generate Todos Tab ────────────────────────────────────────────────
function GenerateTab({ projectId }: { projectId: string }) {
  const { t } = useLang();
  const [prompt, setPrompt] = useState('');
  const [count, setCount]   = useState(5);
  const [drafts, setDrafts] = useState<(DraftTodo & { selected: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setError(''); setSaved(false); setLoading(true);
    try {
      const res = await aiApi.generateTodos(projectId, prompt, count);
      setDrafts(res.todos.map((d) => ({ ...d, selected: true })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.ai.generationFailed);
    } finally { setLoading(false); }
  };

  const toggle = (i: number) => setDrafts((p) => p.map((d, idx) => idx === i ? { ...d, selected: !d.selected } : d));
  const updateField = (i: number, field: string, v: unknown) => setDrafts((p) => p.map((d, idx) => idx === i ? { ...d, [field]: v } : d));

  const saveSelected = async () => {
    const sel = drafts.filter((d) => d.selected);
    if (!sel.length) return;
    setSaving(true);
    try {
      await todosApi.bulk(projectId, { todos: sel.map(({ selected: _s, ...d }) => ({ ...d, sprintId: null })) });
      setSaved(true); setDrafts([]); setPrompt('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.ai.saveFailed);
    } finally { setSaving(false); }
  };

  const selectedCount = drafts.filter((d) => d.selected).length;

  return (
    <div className="p-5 space-y-5 bg-white dark:bg-surface-850">
      <form onSubmit={generate} className="space-y-3">
        <div>
          <label className="label">{t.ai.describeFeature}</label>
          <textarea className="input resize-none" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t.ai.featurePlaceholder} maxLength={2000} />
        </div>
        <div className="flex items-center gap-3">
          <label className="label mb-0 whitespace-nowrap">{t.ai.numberOfTodos}</label>
          <select className="input w-20" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n}>{n}</option>)}
          </select>
          <button type="submit" className="btn-primary" disabled={!prompt.trim() || loading}>
            {loading ? <Spinner size="sm" /> : <Sparkles size={14} />} {t.ai.generateBtn}
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      {saved && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm rounded-md px-3 py-2">
          {t.ai.savedToBacklog}
        </div>
      )}

      {drafts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.ai.suggestions(drafts.length)}</p>
            <div className="flex gap-2">
              <button className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline" onClick={() => setDrafts((p) => p.map((d) => ({ ...d, selected: !p.every((x) => x.selected) })))}>
                {drafts.every((d) => d.selected) ? t.ai.deselectAll : t.ai.selectAll}
              </button>
              <button className="btn-primary text-xs py-1.5" onClick={saveSelected} disabled={saving || selectedCount === 0}>
                {saving ? <Spinner size="sm" /> : <Plus size={12} />} {t.ai.addToBacklog(selectedCount)}
              </button>
            </div>
          </div>
          <div className="border border-gray-200 dark:border-surface-600 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[20px_1fr_90px_90px_60px] gap-2 px-3 py-1.5 bg-gray-50 dark:bg-surface-700 text-xs text-gray-400 font-medium border-b border-gray-200 dark:border-surface-600">
              <span /><span>{t.ai.tableTitle}</span><span>{t.ai.tableType}</span><span>{t.ai.tablePriority}</span><span>{t.ai.tablePts}</span>
            </div>
            {drafts.map((d, i) => (
              <div key={i} className={`grid grid-cols-[20px_1fr_90px_90px_60px] gap-2 items-center px-3 py-2 border-b border-gray-100 dark:border-surface-600 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${!d.selected ? 'opacity-40' : ''}`}>
                <input type="checkbox" checked={d.selected} onChange={() => toggle(i)} className="accent-gray-900 dark:accent-gray-100 w-3.5 h-3.5" />
                <input className="input text-sm py-1" value={d.title} onChange={(e) => updateField(i, 'title', e.target.value)} />
                <select className="input text-xs py-1" value={d.type} onChange={(e) => updateField(i, 'type', e.target.value)}>
                  {TODO_TYPES.map((tp) => <option key={tp} value={tp}>{tp.charAt(0).toUpperCase()+tp.slice(1)}</option>)}
                </select>
                <select className="input text-xs py-1" value={d.priority} onChange={(e) => updateField(i, 'priority', e.target.value)}>
                  {TODO_PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
                <input type="number" className="input text-xs py-1" value={d.storyPoints ?? ''}
                  onChange={(e) => { const n = Number(e.target.value); updateField(i, 'storyPoints', STORY_POINTS.includes(n as typeof STORY_POINTS[number]) ? n : null); }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Plan Sprint Tab ───────────────────────────────────────────────────
function PlanTab({ projectId }: { projectId: string }) {
  const { t } = useLang();
  const [capacity, setCapacity] = useState(30);
  const [focus, setFocus]       = useState('');
  const [plan, setPlan]         = useState<PlanSprintResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [saved, setSaved]       = useState(false);

  const suggest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaved(false); setLoading(true);
    try {
      const res = await aiApi.planSprint(projectId, capacity, focus || undefined);
      setPlan(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.ai.planningFailed);
    } finally { setLoading(false); }
  };

  const createSprint = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await sprintsApi.create(projectId, { goal: plan.goal, todoIds: plan.todoIds });
      setSaved(true); setPlan(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-5 space-y-5 bg-white dark:bg-surface-850">
      <form onSubmit={suggest} className="space-y-3">
        <div className="flex gap-3 items-end">
          <div className="w-40">
            <label className="label">{t.ai.capacity}</label>
            <input type="number" className="input" min={1} max={200} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <label className="label">{t.ai.focus}</label>
            <input className="input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder={t.ai.focusPlaceholder} maxLength={300} />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap" disabled={loading}>
            {loading ? <Spinner size="sm" /> : <Zap size={14} />} {t.ai.suggestPlan}
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      {saved && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm rounded-md px-3 py-2">
          {t.ai.sprintCreated}
        </div>
      )}

      {plan && (
        <div className="space-y-3">
          <div className="border border-gray-200 dark:border-surface-600 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-medium mb-1 uppercase">{t.ai.suggestedGoal}</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{plan.goal}</p>
          </div>
          <div className="border border-gray-200 dark:border-surface-600 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-medium mb-1 uppercase">{t.ai.reasoning}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{plan.reasoning}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.ai.todosPts(plan.todoIds.length, plan.totalPoints)}</p>
            <button className="btn-primary" onClick={createSprint} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Plus size={14} />} {t.ai.createSprint}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary Tab ───────────────────────────────────────────────────────
function SummaryTab({ projectId }: { projectId: string }) {
  const { t } = useLang();
  const [sprintsList, setSprintsList]           = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [loading, setLoading]                   = useState(true);
  const [generating, setGenerating]             = useState(false);
  const [summary, setSummary]                   = useState('');
  const [error, setError]                       = useState('');

  useEffect(() => {
    sprintsApi.list(projectId).then((list) => {
      const eligible = list.filter((s) => s.status !== 'planned');
      setSprintsList(eligible);
      if (eligible.length > 0) setSelectedSprintId(eligible[0].id);
      setLoading(false);
    });
  }, [projectId]);

  const generate = async () => {
    if (!selectedSprintId) return;
    setError(''); setGenerating(true); setSummary('');
    try {
      const res = await aiApi.summarizeSprint(selectedSprintId);
      setSummary(res.summary.content);
      setSprintsList((prev) => prev.map((s) => s.id === res.sprint.id ? res.sprint : s));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally { setGenerating(false); }
  };

  const selectedSprint = sprintsList.find((s) => s.id === selectedSprintId);
  const displaySummary = summary || selectedSprint?.summary?.content;

  if (loading) return <div className="flex justify-center py-12 bg-white dark:bg-surface-850"><Spinner /></div>;

  if (sprintsList.length === 0) {
    return <div className="p-8 text-center text-sm text-gray-400 bg-white dark:bg-surface-850">{t.ai.noSprintsYet}</div>;
  }

  return (
    <div className="p-5 space-y-5 bg-white dark:bg-surface-850">
      <div>
        <label className="label mb-1 block">{t.ai.sprintLabel}</label>
        <div className="flex gap-3">
          <CustomSelect
            className="flex-1 min-w-0"
            options={sprintsList.map((s) => ({ value: s.id, label: `${s.name} (${s.status})` }))}
            value={selectedSprintId}
            onChange={(v) => { setSelectedSprintId(v); setSummary(''); }}
          />
          <button
            className="btn-primary gap-1.5 shrink-0"
            onClick={generate}
            disabled={generating}
          >
            {generating ? <Spinner size="sm" /> : <RotateCcw size={14} />}
            {t.ai.generateSummary}
          </button>
        </div>
      </div>

      {error      && <p className="text-sm text-red-500">{error}</p>}
      {generating && <div className="flex items-center gap-2 text-sm text-gray-400"><Spinner size="sm" /> {t.ai.generatingSummary}</div>}

      {displaySummary && !generating && (
        <div className="border border-gray-200 dark:border-surface-600 rounded-lg p-5">
          <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displaySummary}</ReactMarkdown>
          </div>
          {selectedSprint?.summary?.generatedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-gray-100 dark:border-surface-600">
              {t.sprints.generatedAt} {new Date(selectedSprint.summary.generatedAt).toLocaleDateString()}
              {' '}· {t.ai.generatedSource(selectedSprint.summary.source)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main AI Page ──────────────────────────────────────────────────────
export function AiPage() {
  const { t } = useLang();
  const { projectId }   = useParams<{ projectId: string }>();
  const [tab, setTab]   = useState<Tab>('chat');
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);

  const storageKey = `chat_messages_${projectId}`;
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(chatMessages)); }
    catch { /* quota exceeded */ }
  }, [chatMessages, storageKey]);

  useEffect(() => { aiApi.status().then(setAiStatus).catch(() => null); }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chat',     label: t.ai.tab_chat     },
    { id: 'generate', label: t.ai.tab_generate },
    { id: 'plan',     label: t.ai.tab_plan     },
    { id: 'summary',  label: t.ai.tab_summary  },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">{t.ai.title}</h1>
          {aiStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              aiStatus.mode === 'ai'
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
            }`}>
              ● {aiStatus.mode === 'ai' ? t.ai.modeAi(aiStatus.model ?? '') : t.ai.modeMock}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 max-w-4xl">
        <div className="flex gap-0 mb-0 border-b border-gray-200 dark:border-surface-600">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === tb.id
                  ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div className="border border-t-0 border-gray-200 dark:border-surface-600 rounded-b-lg">
          <div className={tab !== 'chat'     ? 'hidden' : ''}><ChatTab     projectId={projectId!} messages={chatMessages} setMessages={setChatMessages} /></div>
          <div className={tab !== 'generate' ? 'hidden' : ''}><GenerateTab projectId={projectId!} /></div>
          <div className={tab !== 'plan'     ? 'hidden' : ''}><PlanTab     projectId={projectId!} /></div>
          <div className={tab !== 'summary'  ? 'hidden' : ''}><SummaryTab  projectId={projectId!} /></div>
        </div>
      </div>
    </div>
  );
}
