import { useState, useCallback } from 'react';
import { Beaker, Send, User, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';

/**
 * PlaygroundPage - Ambiente de desenvolvimento FUNCIONAL
 * 
 * Agora mostra um chat de verdade com mensagens funcionais!
 */

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    room_id: 'playground',
    account_id: 1,
    sender_id: 2,
    content: 'Bem-vindo ao Playground! 🎮 Use os botões da sidebar ou digite abaixo para testar!',
    message_type: 'text',
    created_at: new Date().toISOString(),
    sender: { id: 2, name: 'Sistema', email: 'sistema@whatpro.com' },
  },
];

export function PlaygroundPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [roomResolved, setRoomResolved] = useState(false);

  // Simular mensagem do atendente
  const handleSimulateMessage = useCallback((content: string, senderId = 2) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      room_id: 'playground',
      account_id: 1,
      sender_id: senderId,
      content,
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender: { id: senderId, name: senderId === 1 ? 'Você' : 'Atendente', email: 'user@whatpro.com' },
    };
    setMessages(prev => [...prev, newMsg]);
  }, []);

  const handleSimulateMention = useCallback(() => {
    const mentions = ['@Maria', '@João', '@Admin'];
    const randomMention = mentions[Math.floor(Math.random() * mentions.length)];
    handleSimulateMessage(`Olá ${randomMention}, preciso da sua ajuda!`);
  }, [handleSimulateMessage]);

  // Enviar sua própria mensagem
  const handleSendMessage = useCallback((content: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      room_id: 'playground',
      account_id: 1,
      sender_id: 1,
      content,
      message_type: 'text',
      created_at: new Date().toISOString(),
      status: 'sent',
      sender: { id: 1, name: 'Você', email: 'you@whatpro.com' },
    };
    setMessages(prev => [...prev, newMsg]);
  }, []);

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar de Controles */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Beaker className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold tracking-tight">Playground</h1>
              <p className="text-purple-100 text-xs">✨ Agora funcional!</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Room Status */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Status da Sala
            </h3>
            <div className={cn(
              'p-3 rounded-lg border-2 transition-colors',
              roomResolved 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {roomResolved ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  roomResolved ? 'text-green-700' : 'text-blue-700'
                )}>
                  {roomResolved ? 'Resolvida' : 'Aberta'}
                </span>
              </div>
              <Button
                onClick={() => setRoomResolved(prev => !prev)}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {roomResolved ? 'Reabrir' : 'Resolver'}
              </Button>
            </div>
          </div>

          {/* Message Simulations */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Simular Mensagens
            </h3>
            <div className="space-y-2">
              <Button
                onClick={() => handleSimulateMessage('Olá! Como posso ajudar? 👋')}
                variant="outline"
                className="w-full justify-start"
              >
                <Send className="h-4 w-4 mr-2" />
                Mensagem do Atendente
              </Button>
              <Button
                onClick={handleSimulateMention}
                variant="outline"
                className="w-full justify-start"
              >
                <User className="h-4 w-4 mr-2" />
                Com @Menção
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-auto pt-4 border-t">
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 leading-relaxed">
              💡 <strong>Dica:</strong> Clique nos botões acima ou digite abaixo para ver as mensagens em ação!
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area - FUNCIONAL */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === 1}
              showSender={true}
            />
          ))}
        </div>

        {/* Composer */}
        <div className="border-t">
          <MessageInput
            onSendMessage={handleSendMessage}
            placeholder="Digite sua mensagem... (Teste o design premium aqui!)"
          />
        </div>
      </main>
    </div>
  );
}
