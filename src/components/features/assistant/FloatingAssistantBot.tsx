'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Layers,
  ArrowUpRight,
  BookOpen,
  GripHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  useGetAssistantConfigQuery,
  useSendAssistantMessageMutation,
} from '@/redux/api/systemAssistantApi';
import { ChatMessage } from '@/types/system-assistant';
import { cn } from '@/lib/utils';

export const FloatingAssistantBot: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Floating Position & Drag States
  const [buttonPos, setButtonPos] = useState<{ x: number; y: number } | null>(null);
  const [chatPos, setChatPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [isDraggingChat, setIsDraggingChat] = useState(false);

  const buttonDragRef = useRef<{
    startX: number;
    startY: number;
    startPointerX: number;
    startPointerY: number;
  } | null>(null);
  const buttonMovedRef = useRef(false);

  const chatDragRef = useRef<{
    startX: number;
    startY: number;
    startPointerX: number;
    startPointerY: number;
  } | null>(null);

  const clampPosition = (pos: { x: number; y: number }, width: number, height: number, padding = 16) => {
    if (typeof window === 'undefined') return pos;
    const maxX = Math.max(padding, window.innerWidth - width - padding);
    const maxY = Math.max(padding, window.innerHeight - height - padding);
    return {
      x: Math.min(Math.max(padding, pos.x), maxX),
      y: Math.min(Math.max(padding, pos.y), maxY),
    };
  };

  useEffect(() => {
    const handleResize = () => {
      setButtonPos((prev) => (prev ? clampPosition(prev, 140, 50) : null));
      setChatPos((prev) => {
        if (!prev) return null;
        const chatW = Math.min(420, window.innerWidth - 32);
        const chatH = Math.min(620, window.innerHeight - 80);
        return clampPosition(prev, chatW, chatH);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenChat = () => {
    if (!chatPos && typeof window !== 'undefined') {
      const chatW = Math.min(420, window.innerWidth - 32);
      const chatH = Math.min(620, window.innerHeight - 80);
      if (buttonPos) {
        let targetX = buttonPos.x + 140 - chatW;
        let targetY = buttonPos.y - chatH;
        if (targetY < 16) targetY = buttonPos.y + 56;
        setChatPos(clampPosition({ x: targetX, y: targetY }, chatW, chatH));
      } else {
        setChatPos({
          x: Math.max(16, window.innerWidth - chatW - 24),
          y: Math.max(16, window.innerHeight - chatH - 24),
        });
      }
    }
    setIsOpen(true);
  };

  const handleButtonPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    buttonDragRef.current = {
      startX: buttonPos?.x ?? rect.left,
      startY: buttonPos?.y ?? rect.top,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
    };
    buttonMovedRef.current = false;
    setIsDraggingButton(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleButtonPointerMove = (e: React.PointerEvent) => {
    if (!buttonDragRef.current) return;
    const dx = e.clientX - buttonDragRef.current.startPointerX;
    const dy = e.clientY - buttonDragRef.current.startPointerY;
    if (Math.hypot(dx, dy) > 5) {
      buttonMovedRef.current = true;
    }
    const newX = buttonDragRef.current.startX + dx;
    const newY = buttonDragRef.current.startY + dy;
    setButtonPos(clampPosition({ x: newX, y: newY }, 140, 50));
  };

  const handleButtonPointerUp = (e: React.PointerEvent) => {
    if (!buttonDragRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    const wasMoved = buttonMovedRef.current;
    buttonDragRef.current = null;
    setIsDraggingButton(false);
    if (!wasMoved) {
      handleOpenChat();
    }
  };

  const handleChatPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) return;

    const chatContainer = (e.currentTarget as HTMLElement).parentElement;
    const rect = chatContainer ? chatContainer.getBoundingClientRect() : null;
    const currentX = chatPos?.x ?? (rect ? rect.left : 0);
    const currentY = chatPos?.y ?? (rect ? rect.top : 0);

    chatDragRef.current = {
      startX: currentX,
      startY: currentY,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
    };
    setIsDraggingChat(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleChatPointerMove = (e: React.PointerEvent) => {
    if (!chatDragRef.current) return;
    const dx = e.clientX - chatDragRef.current.startPointerX;
    const dy = e.clientY - chatDragRef.current.startPointerY;
    const chatW = Math.min(420, typeof window !== 'undefined' ? window.innerWidth - 32 : 420);
    const chatH = Math.min(620, typeof window !== 'undefined' ? window.innerHeight - 80 : 620);
    const newX = chatDragRef.current.startX + dx;
    const newY = chatDragRef.current.startY + dy;
    setChatPos(clampPosition({ x: newX, y: newY }, chatW, chatH));
  };

  const handleChatPointerUp = (e: React.PointerEvent) => {
    if (!chatDragRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    chatDragRef.current = null;
    setIsDraggingChat(false);
  };

  // Assistant Configuration
  const { data: configRes, isLoading: isLoadingConfig } = useGetAssistantConfigQuery();
  const config = configRes?.data;

  // Chat Mutation
  const [sendMessage, { isLoading: isSending }] = useSendAssistantMessageMutation();

  // Route Context Label
  const getRouteLabel = (path: string) => {
    if (path.includes('workflow-builder')) return 'Workflow Builder';
    if (path.includes('contact-hub') || path.includes('contact-group')) return 'Contacts & Groups';
    if (path.includes('ai-voice-agent')) return 'AI Voice Agent';
    if (path.includes('ai-campaign-hub') || path.includes('sms-campaigns')) return 'Campaigns';
    if (path.includes('phone-numbers') || path.includes('trunk-integration')) return 'Phone Numbers & SIP';
    if (path.includes('toolbox-hub')) return 'Toolbox Hub';
    if (path.includes('inbox')) return 'SMS Inbox';
    if (path.includes('settings')) return 'Settings';
    if (path.includes('dashboard')) return 'Dashboard';
    return 'Application Guide';
  };

  const activeContext = getRouteLabel(pathname || '');

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isSending]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Don't render if assistant is disabled by admin
  if (!isLoadingConfig && config && !config.is_enabled) {
    return null;
  }

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage('');

    try {
      const response = await sendMessage({
        message: text,
        conversation_history: newHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        current_path: pathname || '',
      }).unwrap();

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response?.data?.reply || 'I could not process this request right now.',
        sources: response?.data?.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          err?.data?.message ||
          'Sorry, I encountered an issue reaching the assistant. Please verify your internet connection or check with the administrator.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* 1. FLOATING BUBBLE BUTTON (DRAGGABLE) */}
      {!isOpen && (
        <button
          onPointerDown={handleButtonPointerDown}
          onPointerMove={handleButtonPointerMove}
          onPointerUp={handleButtonPointerUp}
          style={buttonPos ? { left: `${buttonPos.x}px`, top: `${buttonPos.y}px` } : undefined}
          className={cn(
            'fixed z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-primary text-white shadow-2xl',
            'border border-white/20 select-none touch-none cursor-grab active:cursor-grabbing',
            !buttonPos && 'bottom-6 right-6',
            isDraggingButton
              ? 'scale-105 shadow-primary/40 transition-none'
              : 'hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200'
          )}
          aria-label="Open AI Assistant Guide"
          title="Drag to reposition anywhere · Click to open"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span className="font-semibold text-xs tracking-wide">
            {config?.bot_name || 'AI Guide'}
          </span>
          <GripHorizontal className="w-3.5 h-3.5 opacity-60 ml-0.5" />
        </button>
      )}

      {/* 2. CHAT DRAWER / WINDOW (DRAGGABLE) */}
      {isOpen && (
        <div
          style={chatPos ? { left: `${chatPos.x}px`, top: `${chatPos.y}px` } : undefined}
          className={cn(
            'fixed z-50 flex flex-col',
            'w-[420px] max-w-[calc(100vw-32px)] h-[620px] max-h-[calc(100vh-80px)]',
            'bg-white dark:bg-[#120724] text-title dark:text-[#f5f3ff]',
            'border border-input-border-color dark:border-white/10 rounded-2xl shadow-2xl',
            'overflow-hidden',
            !chatPos && 'bottom-6 right-6',
            isDraggingChat
              ? 'transition-none select-none shadow-primary/30 ring-2 ring-primary/40'
              : 'transition-all duration-200'
          )}
        >
          {/* HEADER (DRAG HANDLE) */}
          <div
            onPointerDown={handleChatPointerDown}
            onPointerMove={handleChatPointerMove}
            onPointerUp={handleChatPointerUp}
            onDoubleClick={() => setChatPos(null)}
            title="Click and drag to move window anywhere (Double-click to reset to bottom-right)"
            className="flex items-center justify-between px-4 py-3.5 bg-slate-50 dark:bg-[#19092B] border-b border-input-border-color dark:border-white/10 shrink-0 cursor-grab active:cursor-grabbing select-none touch-none group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight text-title dark:text-[#f5f3ff]">
                    {config?.bot_name || 'Voxeno Assistant'}
                  </h3>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-subtitle-color dark:text-[#c4b5fd]">
                  <Layers className="w-3 h-3 text-primary" />
                  <span>{activeContext}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center px-1 py-0.5 rounded text-subtitle-color/50 group-hover:text-subtitle-color dark:text-[#c4b5fd]/50 dark:group-hover:text-[#c4b5fd] transition-colors"
                title="Drag handle"
              >
                <GripHorizontal className="w-4 h-4" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-subtitle-color hover:text-title hover:bg-slate-200/50 dark:hover:bg-white/10"
                onClick={handleResetChat}
                title="Restart conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-subtitle-color hover:text-title hover:bg-slate-200/50 dark:hover:bg-white/10"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-[#120724]"
          >
            {/* WELCOME BANNER (IF NO MESSAGES) */}
            {messages.length === 0 && (
              <div className="space-y-4 py-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#19092B] border border-input-border-color dark:border-white/10">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-title dark:text-[#f5f3ff] leading-relaxed">
                      {config?.welcome_message ||
                        'Hi there! I am your Voxeno guide. How can I help you build workflows, import contacts, configure nodes, or set up phone agents?'}
                    </p>
                    <p className="text-[10px] text-subtitle-color dark:text-[#c4b5fd]">
                      Ask any question about using the platform.
                    </p>
                  </div>
                </div>

                {/* SUGGESTED QUICK PROMPT CHIPS */}
                {config?.suggested_prompts && config.suggested_prompts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-subtitle-color dark:text-[#c4b5fd] uppercase tracking-wider px-1">
                      Quick Questions
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {config.suggested_prompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(prompt)}
                          className="flex items-center justify-between text-left text-xs px-3 py-2.5 rounded-lg bg-white dark:bg-[#19092B] border border-input-border-color dark:border-white/10 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-[#240c3d] transition-colors text-title dark:text-[#f5f3ff] group shadow-xs"
                        >
                          <span className="line-clamp-1">{prompt}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-subtitle-color group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MESSAGE BUBBLES */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col',
                  msg.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs',
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-xs shadow-xs'
                      : 'bg-slate-50 dark:bg-[#19092B] text-title dark:text-[#f5f3ff] border border-input-border-color dark:border-white/10 shadow-sm rounded-bl-xs'
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div>
                      <MarkdownRenderer content={msg.content} />
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-input-border-color dark:border-white/10 flex flex-wrap items-center gap-1 text-[10px] text-subtitle-color dark:text-[#c4b5fd]">
                          <BookOpen className="w-3 h-3 text-primary inline" />
                          <span>Sources:</span>
                          {msg.sources.map((src, i) => (
                            <span
                              key={i}
                              className="bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded font-medium text-title dark:text-[#f5f3ff]"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-subtitle-color dark:text-[#c4b5fd] mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* TYPING INDICATOR */}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-subtitle-color dark:text-[#c4b5fd] bg-slate-50 dark:bg-[#19092B] border border-input-border-color dark:border-white/10 rounded-2xl px-3 py-2 w-fit">
                <Bot className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-[11px]">Consulting system knowledge...</span>
              </div>
            )}
          </div>

          {/* INPUT BAR FOOTER */}
          <div className="p-3 bg-slate-50 dark:bg-[#19092B] border-t border-input-border-color dark:border-white/10 shrink-0">
            <div className="relative flex items-center bg-white dark:bg-[#120724] rounded-xl border border-input-border-color dark:border-white/10 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-xs">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask how to use a feature or node..."
                className="w-full resize-none bg-transparent px-3 py-2.5 text-xs text-title dark:text-[#f5f3ff] placeholder:text-subtitle-color dark:placeholder:text-[#c4b5fd]/60 focus:outline-none max-h-24 custom-scrollbar"
                disabled={isSending}
              />
              <Button
                type="button"
                size="icon"
                disabled={!inputMessage.trim() || isSending}
                onClick={() => handleSend()}
                className="h-7 w-7 rounded-lg mr-2 shrink-0 bg-primary hover:bg-primary/90 text-white"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-subtitle-color dark:text-[#c4b5fd] px-1 mt-1.5">
              <span>Enter to send · Shift+Enter for new line</span>
              <span className="text-primary font-medium"> Voxeno Guide</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
