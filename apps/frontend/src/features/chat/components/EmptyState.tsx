import { MessageCircle, Inbox, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EmptyState - Premium empty state component
 * 
 * Design principles (@frontend-specialist):
 * - Soft, welcoming colors
 * - Clear iconography
 * - Helpful messaging
 * - Action-oriented CTA
 * 
 * @clean-code: Single responsibility, composable variants
 */

export type EmptyStateVariant = 'no-messages' | 'no-rooms' | 'no-search-results' | 'no-selection';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  className?: string;
}

const emptyStates = {
  'no-messages': {
    icon: MessageCircle,
    title: 'Nenhuma mensagem ainda',
    description: 'Seja o primeiro a enviar uma mensagem nesta conversa',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-50',
  },
  'no-rooms': {
    icon: Inbox,
    title: 'Nenhuma conversa',
    description: 'Aguarde novas conversas ou inicie uma nova',
    iconColor: 'text-gray-400',
    bgColor: 'bg-gray-50',
  },
  'no-search-results': {
    icon: Search,
    title: 'Nenhum resultado',
    description: 'Tente ajustar seus termos de busca',
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-50',
  },
  'no-selection': {
    icon: MessageCircle,
    title: 'Selecione uma conversa',
    description: 'Escolha uma conversa da lista para começar',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-50',
  },
} as const;

export function EmptyState({ variant, className }: EmptyStateProps) {
  const config = emptyStates[variant];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center justify-center h-full p-8', className)}>
      <div className="text-center max-w-sm">
        {/* Icon Container */}
        <div className={cn(
          'inline-flex items-center justify-center',
          'h-20 w-20 rounded-2xl mb-6',
          'shadow-sm',
          config.bgColor
        )}>
          <Icon className={cn('h-10 w-10', config.iconColor)} strokeWidth={1.5} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {config.description}
        </p>
      </div>
    </div>
  );
}
