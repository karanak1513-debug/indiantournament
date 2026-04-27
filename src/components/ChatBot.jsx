import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[370px] h-[600px] rounded-2xl overflow-hidden shadow-2xl shadow-neon-blue/30 border border-neon-blue/40 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f0f1a] to-[#1a1a2e] px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neon-blue/20 border border-neon-blue/50 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-neon-blue" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Battle Arena Support</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-green-400 text-xs">Online</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-light hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chatbase iframe */}
          <iframe
            src="https://www.chatbase.co/chatbot-iframe/15IUj93KeSt5Eu8ZLWEpD"
            width="100%"
            style={{ height: '100%', minHeight: '500px', border: 'none', background: '#0f0f1a' }}
            frameBorder="0"
            title="Battle Arena Support Chat"
          />
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-neon-red/20 border-2 border-neon-red shadow-neon-red/40'
            : 'bg-neon-blue/20 border-2 border-neon-blue shadow-neon-blue/40'
        }`}
        style={{
          boxShadow: isOpen
            ? '0 0 30px rgba(255,50,50,0.5)'
            : '0 0 30px rgba(0,200,255,0.5)',
        }}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-neon-red" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 text-neon-blue" />
            {/* Pulse ring */}
            <span className="absolute w-16 h-16 rounded-full border-2 border-neon-blue/50 animate-ping" />
          </>
        )}
      </button>

      {/* Tooltip label */}
      {!isOpen && (
        <div className="absolute bottom-20 right-0 bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap pointer-events-none">
          💬 Need help? Chat with us!
        </div>
      )}
    </div>
  );
}
