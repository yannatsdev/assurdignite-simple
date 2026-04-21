import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
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
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: "Bonjour ! 👋 Je suis l'assistant virtuel **AssurDignité** propulsé par l'IA. Comment puis-je vous aider ?", isBot: true, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AiMsg[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm font-sans">Assistant IA AssurDignité</p>
                  <p className="text-white/70 text-xs">Propulsé par Gemini • SONAM VIE</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.isBot ? 'bg-muted text-foreground rounded-tl-sm' : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}>
                    {msg.text ? formatMessage(msg.text) : <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Réflexion...</span>}
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

            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {['Quelles formules ?', 'Comment souscrire ?', 'Bonus Fidélité', 'Modes de paiement', 'Contact'].map(s => (
                  <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

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

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
