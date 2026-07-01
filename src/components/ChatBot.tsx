import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, Minus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

type AiMsg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;

// Strip placeholder links like [text](lien_vers_xxx) → text, and remove unresolved (lien_xxx)
function sanitizeMarkdown(text: string): string {
  return text
    // Replace [label](placeholder) where placeholder isn't a real URL
    .replace(/\[([^\]]+)\]\((?!https?:\/\/|mailto:|tel:|\/)[^)]+\)/gi, '$1')
    // Remove orphan (lien_xxx)
    .replace(/\((lien_[^)]+)\)/gi, '')
    .trim();
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('chatbot_minimized') === '1';
  });
  const setMinimizedPersist = (v: boolean) => {
    setMinimized(v);
    try { localStorage.setItem('chatbot_minimized', v ? '1' : '0'); } catch {}
  };
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: "Bonjour ! 👋 Je suis l'assistant virtuel **AssurDignité** propulsé par l'IA. Comment puis-je vous aider ?", isBot: true, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AiMsg[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Drag position (bottom-right offset in px). Persisted in localStorage.
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 16, y: 16 };
    try {
      const raw = localStorage.getItem('chatbot_pos');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { x: 16, y: 16 };
  });
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; origX: number; origY: number; moved: boolean }>({
    dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false,
  });

  const onDragStart = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      dragging: true, startX: e.clientX, startY: e.clientY,
      origX: pos.x, origY: pos.y, moved: false,
    };
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.moved = true;
    // pos is offset from bottom-right, so dragging right/down decreases it
    const nx = Math.max(4, Math.min(window.innerWidth - 60, dragState.current.origX - dx));
    const ny = Math.max(4, Math.min(window.innerHeight - 60, dragState.current.origY - dy));
    setPos({ x: nx, y: ny });
  };
  const onDragEnd = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    try { localStorage.setItem('chatbot_pos', JSON.stringify(pos)); } catch {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now(), text: msgText, isBot: false, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const newHistory: AiMsg[] = [...conversationHistory, { role: 'user', content: msgText }];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newHistory }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error('Failed to get AI response');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantSoFar = '';
      let streamDone = false;
      const botMsgId = Date.now() + 1;

      // Add initial bot message
      setMessages(prev => [...prev, { id: botMsgId, text: '', isBot: true, timestamp: new Date() }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const current = assistantSoFar;
              setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: current } : m));
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) assistantSoFar += content;
          } catch { /* ignore */ }
        }
        if (assistantSoFar) {
          const final = assistantSoFar;
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: final } : m));
        }
      }

      setConversationHistory([...newHistory, { role: 'assistant', content: assistantSoFar }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Désolé, une erreur s'est produite. Veuillez réessayer ou contactez-nous au **27 20 31 71 82**.",
        isBot: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[560px] rounded-2xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-sonam p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary border-2 border-white animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm font-sans">Assistant ASSURDIGNITÉ</p>
                  <p className="text-white/70 text-xs">Propulsé par IA • ASSURDIGNITE</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setIsOpen(false); setMinimizedPersist(true); }}
                  className="text-white/80 hover:text-white p-1"
                  aria-label="Réduire"
                  title="Réduire"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1" aria-label="Fermer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.isBot ? 'bg-muted text-foreground rounded-tl-sm' : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}>
                    {msg.text ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-1 prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-strong:text-foreground prose-a:text-primary">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => {
                              const isReal = href && /^(https?:|mailto:|tel:|\/)/i.test(href);
                              return isReal
                                ? <a href={href} target="_blank" rel="noreferrer">{children}</a>
                                : <span>{children}</span>;
                            },
                          }}
                        >
                          {sanitizeMarkdown(msg.text)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Réflexion...</span>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.isBot === false && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Réflexion...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              <a href="/client/paiement" className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">💳 Payer ma prime</a>
              <a href="/client/sinistre" className="text-xs px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-600 hover:text-white transition-colors">🚨 Déclarer un sinistre</a>
              <a href="/client/documents" className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors">📄 Mon attestation</a>
              <a href="/client/historique-sinistres" className="text-xs px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors">🔍 Suivre un sinistre</a>
              {messages.length <= 2 && ['Quelles formules ?', 'Bonus Fidélité', 'Contact'].map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Posez votre question..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button size="icon" onClick={() => sendMessage()} className="rounded-full shrink-0" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {minimized ? (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setMinimizedPersist(false); setIsOpen(true); }}
          className="fixed bottom-4 right-4 sm:right-6 z-50 w-9 h-9 rounded-full bg-primary/90 backdrop-blur text-primary-foreground shadow-md flex items-center justify-center hover:shadow-lg transition-shadow border border-white/20"
          title="Ouvrir l'assistant"
          aria-label="Ouvrir l'assistant"
        >
          <Maximize2 className="w-4 h-4" />
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow group"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {!isOpen && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setMinimizedPersist(true); }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-card border border-border text-muted-foreground hover:text-primary flex items-center justify-center shadow"
              title="Réduire"
              aria-label="Réduire"
            >
              <Minus className="w-3 h-3" />
            </span>
          )}
        </motion.button>
      )}
    </>
  );
}
