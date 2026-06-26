'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User, Sparkles, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const suggestedQuestions = [
  '¿Cuál es el nicho más rentable para empezar?',
  '¿Cómo encuentro un nicho con poca competencia?',
  '¿Qué tipo de contenido funciona mejor en finanzas?',
  '¿Cómo puedo monetizar un canal nuevo?',
  '¿Qué nichos están en tendencia en 2026?',
];

export function AIChatView() {
  const { chatMessages, addChatMessage, clearChat, loadChatMessages } = useAppStore();
  const { status: aiStatus, check: recheckAI } = useAIStatus();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatMessages();
  }, [loadChatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendMessage = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    setInput('');
    setErrorMsg('');
    addChatMessage({ role: 'user', content: message });
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user' as const, content: message }],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Surface the error clearly instead of pretending the AI replied
        const friendly =
          data?.code === 'AI_UNAVAILABLE'
            ? 'El servicio de IA no está disponible. Verifica la conexión del servidor.'
            : data?.error || 'Error al procesar tu mensaje.';
        setErrorMsg(friendly);
        // Don't add a fake assistant message — leave the user message visible
        return;
      }

      addChatMessage({ role: 'assistant', content: data.content });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold">Asistente IA</h2>
        <p className="text-muted-foreground text-sm">Tu experto en YouTube y creación de contenido</p>
      </div>

      <AIModeBanner
        available={aiStatus.available}
        loading={aiStatus.loading}
        error={aiStatus.error}
        onRetry={recheckAI}
      />

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col min-h-[500px]">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Asistente NexScope
            </CardTitle>
            {chatMessages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm('¿Borrar todo el historial del chat? Esta acción no se puede deshacer.')) {
                    clearChat();
                    setErrorMsg('');
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">¡Hola! Soy tu asistente IA</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Puedo ayudarte a encontrar nichos rentables, analizar canales y crear estrategias de contenido.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3"
                    onClick={() => sendMessage(q)}
                    disabled={!aiStatus.available || loading}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 border border-border/50'
                    )}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div className="flex gap-3">
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
                      onClick={() => sendMessage()}
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
              placeholder={
                aiStatus.available
                  ? 'Escribe tu pregunta...'
                  : 'IA no disponible — escribe y pulsa enviar para reintentar'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
