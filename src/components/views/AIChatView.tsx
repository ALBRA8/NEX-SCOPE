'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bot, Send, User, Sparkles, Loader2, Trash2, AlertCircle,
  Wrench, CheckCircle2, XCircle, ChevronDown, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES — mirror of src/lib/agent/executor.ts AgentEvent
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'running' | 'ok' | 'error';
  result?: unknown;
  error?: string;
}

interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

const suggestedPrompts = [
  '¿Qué nichos tengo guardados?',
  'Encuentra 15 keywords para el nicho "IA generativa"',
  'Busca canales de YouTube sobre fitness y dime sus suscriptores',
  'Genera un plan de 30 videos para un canal de cocina enfocado en veganos',
  'Calcula la monetización de un canal de gaming con 50k subs y 200k vistas/mes',
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL CARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ToolCard({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const statusIcon =
    call.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
    : call.status === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
    : <XCircle className="w-3.5 h-3.5 text-red-500" />;

  const summary = (() => {
    if (call.status === 'running') return 'Ejecutando…';
    if (call.status === 'error') return call.error || 'Error';
    const r = call.result as any;
    if (r && typeof r === 'object') {
      if ('count' in r) return `${r.count} elemento(s)`;
      if ('saved' in r) return r.saved ? 'Guardado' : 'Ya existía';
      if ('deleted' in r) return r.deleted ? 'Eliminado' : 'No encontrado';
      if ('keywords' in r) return `${r.keywords.length} keywords`;
      if ('gaps' in r) return `${r.gaps.length} brechas`;
      if ('plan' in r) return `${r.plan.length} videos`;
      if ('trends' in r) return `${r.trends.length} tendencias`;
      if ('rpm' in r) return `RPM $${r.rpm}`;
      if ('error' in r) return `⚠ ${r.error}`;
    }
    return 'OK';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 ml-10 rounded-lg border border-primary/20 bg-primary/5 overflow-hidden text-xs"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors text-left"
      >
        <Wrench className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-mono font-semibold text-primary">{call.name}</span>
        <span className="text-muted-foreground truncate flex-1">{summary}</span>
        {statusIcon}
        {expanded
          ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
          : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-primary/10 p-3 space-y-2"
          >
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Argumentos</div>
              <pre className="text-[11px] font-mono bg-muted/50 rounded p-2 overflow-x-auto max-h-40">
                {JSON.stringify(call.args, null, 2)}
              </pre>
            </div>
            {call.result !== undefined && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Resultado</div>
                <pre className="text-[11px] font-mono bg-muted/50 rounded p-2 overflow-x-auto max-h-60">
                  {JSON.stringify(call.result, null, 2)}
                </pre>
              </div>
            )}
            {call.error && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-red-500 mb-1">Error</div>
                <pre className="text-[11px] font-mono bg-red-500/5 border border-red-500/20 rounded p-2">{call.error}</pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AIChatView() {
  const { user } = useAppStore();
  const { status: aiStatus, check: recheckAI } = useAIStatus();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastMessage, setLastMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [items, scrollToBottom]);

  /**
   * Streams events from /api/agent (SSE) and progressively builds the chat
   * with inline tool cards.
   */
  const sendMessage = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setInput('');
    setErrorMsg('');
    setLastMessage(message);

    const userItem: ChatItem = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
    };
    const assistantItem: ChatItem = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      toolCalls: [],
    };
    setItems((prev) => [...prev, userItem, assistantItem]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = items
        .filter((it) => it.content)
        .map((it) => ({ role: it.role, content: it.content }))
        .slice(-20);

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, messages: history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const friendly =
          data?.code === 'AI_UNAVAILABLE'
            ? 'El servicio de IA no está disponible. Verifica la conexión del servidor.'
            : data?.error || 'Error al procesar tu mensaje.';
        // Remove the empty assistant bubble and show error
        setItems((prev) => prev.filter((it) => it.id !== assistantItem.id));
        setErrorMsg(friendly);
        return;
      }

      if (!res.body) throw new Error('Sin respuesta del servidor');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        // Split on "data: " boundaries
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') {
            done = true;
            break;
          }
          let event: any;
          try { event = JSON.parse(jsonStr); } catch { continue; }

          if (event.type === 'tool_call') {
            const newCall: ToolCall = {
              id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: event.name,
              args: event.args || {},
              status: 'running',
            };
            setItems((prev) => prev.map((it) =>
              it.id === assistantItem.id
                ? { ...it, toolCalls: [...(it.toolCalls || []), newCall] }
                : it
            ));
          } else if (event.type === 'tool_result') {
            setItems((prev) => prev.map((it) => {
              if (it.id !== assistantItem.id || !it.toolCalls) return it;
              const calls = [...it.toolCalls];
              // Update the LAST call with this name that's still running
              for (let i = calls.length - 1; i >= 0; i--) {
                if (calls[i].name === event.name && calls[i].status === 'running') {
                  calls[i] = {
                    ...calls[i],
                    status: event.ok ? 'ok' : 'error',
                    result: event.result,
                    error: event.error,
                  };
                  break;
                }
              }
              return { ...it, toolCalls: calls };
            }));
          } else if (event.type === 'message') {
            setItems((prev) => prev.map((it) =>
              it.id === assistantItem.id
                ? { ...it, content: it.content + (event.content || '') }
                : it
            ));
          } else if (event.type === 'error') {
            setErrorMsg(event.message || 'Error del agente');
            setItems((prev) => prev.filter((it) => it.id !== assistantItem.id));
            done = true;
          } else if (event.type === 'done') {
            done = true;
          }
        }
      }

      // If the assistant bubble is still empty (no message event), remove it
      setItems((prev) => {
        const target = prev.find((it) => it.id === assistantItem.id);
        if (target && !target.content && (!target.toolCalls || target.toolCalls.length === 0)) {
          return prev.filter((it) => it.id !== assistantItem.id);
        }
        return prev;
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setErrorMsg(err?.message || 'Error de red. Intenta de nuevo.');
      setItems((prev) => prev.filter((it) => it.id !== assistantItem.id));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          Agente IA
        </h2>
        <p className="text-muted-foreground text-sm">
          Tu asistente agéntico — opera el sistema por ti: busca, genera, guarda y analiza.
        </p>
      </div>

      <AIModeBanner
        available={aiStatus.available}
        loading={aiStatus.loading}
        error={aiStatus.error}
        onRetry={recheckAI}
      />

      {/* Chat Card */}
      <Card className="flex-1 flex flex-col min-h-[500px]">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              NexScope Agent
            </CardTitle>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm('¿Borrar la conversación?')) {
                      setItems([]);
                      setErrorMsg('');
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Hola {user?.name?.split(' ')[0] || ''} 👋</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Soy tu <strong>agente agéntico</strong>. Puedo usar herramientas para leer tu dashboard,
                generar keywords, buscar en YouTube, crear planes de contenido y guardar todo en tu cuenta.
                Pídeme lo que quieras y lo haré paso a paso.
              </p>
              <div className="flex flex-col gap-2 justify-center max-w-2xl w-full">
                {suggestedPrompts.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2.5 px-3 justify-start text-left"
                    onClick={() => sendMessage(q)}
                    disabled={!aiStatus.available || loading}
                  >
                    <Sparkles className="w-3 h-3 mr-2 shrink-0 text-primary" />
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={cn('flex gap-3', item.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {item.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="max-w-[80%] flex flex-col">
                        {item.content && (
                          <div className={cn(
                            'rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap',
                            item.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 border border-border/50'
                          )}>
                            {item.content}
                          </div>
                        )}
                        {item.role === 'assistant' && item.toolCalls?.map((tc) => (
                          <ToolCard key={tc.id} call={tc} />
                        ))}
                      </div>
                      {item.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && items.length > 0 && items[items.length - 1]?.role === 'assistant' && !items[items.length - 1]?.content && (items[items.length - 1]?.toolCalls?.length || 0) === 0 && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-amber-500/5 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                    {errorMsg}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 text-xs underline"
                      onClick={() => sendMessage(lastMessage)}
                    >
                      Reintentar
                    </Button>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <Input
              placeholder={aiStatus.available ? 'Pídeme lo que quieras…' : 'IA no disponible'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            {loading ? (
              <Button type="button" variant="destructive" onClick={stopGeneration}>
                Detener
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim() || !aiStatus.available}>
                <Send className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
}
