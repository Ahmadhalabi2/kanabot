import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ai as aiApi } from '../../lib/api';
import type { ChatMessage, Sprint } from '../../types/api';
import { Spinner } from '../ui/Spinner';
import { useLang } from '../../context/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  activeSprint?: Sprint | null;
  onGenerateTodos?: () => void;
  onPlanSprint?: () => void;
}

export function AiDrawer({ open, onClose, projectId, activeSprint, onGenerateTodos, onPlanSprint }: Props) {
  const { t } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const listRef                 = useRef<HTMLDivElement>(null);

  // Scroll ONLY the messages container (never ancestors).
  // scrollIntoView() was scrolling the whole page horizontally toward the
  // off-screen drawer, which shifted the entire layout to the left.
  useEffect(() => {
    const el = listRef.current;
    if (!el || messages.length === 0) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    try {
      const res = await aiApi.chat(projectId, updated);
      setMessages((m) => [...m, res.message]);
    } catch (err: unknown) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${err instanceof Error ? err.message : t.common.error}` }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />}

      <div className={`fixed top-0 end-0 h-full w-full sm:w-96 bg-white dark:bg-surface-700 border-s border-gray-200 dark:border-surface-600 shadow-xl z-50 flex flex-col
                      transition-[opacity,transform] duration-300
                      pt-[env(safe-area-inset-top)]
                      ${open
                        ? 'opacity-100 translate-x-0 pointer-events-auto'
                        : 'opacity-0 translate-x-full rtl:-translate-x-full pointer-events-none invisible'
                      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-surface-600 shrink-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.ai.assistantTitle}</span>
          <button className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-surface-600 shrink-0 flex-wrap">
          {onGenerateTodos && (
            <button className="btn-secondary text-xs py-1.5" onClick={() => { onClose(); onGenerateTodos(); }}>
              {t.ai.createTodos}
            </button>
          )}
          {onPlanSprint && (
            <button className="btn-secondary text-xs py-1.5" onClick={() => { onClose(); onPlanSprint(); }}>
              {t.ai.planSprint}
            </button>
          )}
          {activeSprint && (
            <button
              className="btn-secondary text-xs py-1.5"
              onClick={async () => {
                setMessages((m) => [...m, { role: 'user', content: `Summarize ${activeSprint.name}` }]);
                setLoading(true);
                try {
                  const res = await aiApi.summarizeSprint(activeSprint.id);
                  setMessages((m) => [...m, { role: 'assistant', content: res.summary.content }]);
                } catch (err: unknown) {
                  setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${err instanceof Error ? err.message : t.common.error}` }]);
                } finally { setLoading(false); }
              }}
            >
              {t.ai.summarizeSprint}
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-gray-400">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.ai.askAnything}</p>
              <p className="text-xs">{t.ai.askAnythingHint}</p>
            </div>
          )}
          {messages.length > 0 && (
            <p className="text-xs text-gray-400 text-center">{t.common.today}</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-surface-600 flex items-center justify-center text-xs shrink-0">✦</div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              {msg.role === 'assistant' && msg.content.includes('draft todos') && (
                <button className="mt-1 btn-secondary text-xs py-0.5 whitespace-nowrap" onClick={() => onGenerateTodos?.()}>
                  {t.ai.reviewAndAdd}
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-surface-600 flex items-center justify-center text-xs shrink-0">✦</div>
              <div className="bg-gray-100 dark:bg-surface-600 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-400 flex items-center gap-1.5">
                {t.ai.thinking}
                <span className="inline-flex gap-0.5">
                  {[0,1,2].map((j) => <span key={j} className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={send} className="border-t border-gray-200 dark:border-surface-600 p-3 flex gap-2 shrink-0">
          <input className="input flex-1 text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.ai.chatPlaceholder} disabled={loading} />
          <button type="submit" className="btn-primary px-3" disabled={!input.trim() || loading}>
            {loading ? <Spinner size="sm" /> : t.ai.sendBtn}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center pb-2">{t.ai.aiCaution}</p>
      </div>
    </>
  );
}