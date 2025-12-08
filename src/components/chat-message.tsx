import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const Icon = role === 'assistant' ? Bot : User;
  const avatarBg =
    role === 'user'
      ? 'bg-accent text-accent-foreground'
      : 'bg-primary text-primary-foreground';
  const avatarFallback = <Icon className="h-5 w-5" />;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 w-full',
        role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {role === 'assistant' && (
        <Avatar className="h-9 w-9 border">
          <AvatarFallback className={avatarBg}>{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg p-3 text-sm shadow-sm animate-in fade-in-20 zoom-in-95',
          role === 'user'
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-card-foreground rounded-bl-none'
        )}
      >
        <p className="leading-relaxed">{content}</p>
      </div>
      {role === 'user' && (
        <Avatar className="h-9 w-9 border">
          <AvatarFallback className={avatarBg}>{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
