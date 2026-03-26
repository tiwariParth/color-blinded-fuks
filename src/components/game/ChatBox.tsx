'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/socket/client';
import { useGameStore } from '@/hooks/useGameState';

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export function ChatBox() {
  const socket = getSocket();
  const playerId = useGameStore((s) => s.playerId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (data: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-99), data]);
      if (!isOpen) setUnread((n) => n + 1);
    };

    socket.on('CHAT_MESSAGE', handler);
    return () => {
      socket.off('CHAT_MESSAGE', handler);
    };
  }, [socket, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    socket.emit('SEND_MESSAGE', { message: trimmed });
    setInput('');
  }, [socket, input]);

  const toggleOpen = useCallback(() => {
    setIsOpen((o) => !o);
    setUnread(0);
  }, []);

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex w-[calc(100vw-1rem)] max-w-72 flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
          >
            {/* Messages */}
            <div className="flex h-48 sm:h-64 flex-col gap-1 overflow-y-auto p-2 sm:p-3 scrollbar-thin">
              {messages.length === 0 && (
                <p className="text-center text-xs text-zinc-600 mt-auto mb-auto">
                  No messages yet
                </p>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.playerId === playerId;
                return (
                  <div
                    key={`${msg.timestamp}-${i}`}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[10px] text-zinc-500 mb-0.5">
                        {msg.playerName}
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm break-words ${
                        isMe
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex border-t border-zinc-700 p-2 gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={toggleOpen}
        className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 shadow-lg transition-colors hover:bg-zinc-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
