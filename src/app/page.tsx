'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send } from 'lucide-react';
import { getAssistantResponse } from '@/app/actions';
import { ChatMessage } from '@/components/chat-message';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [conversation, setConversation] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Welcome to Contextual Chat! Please provide your name and a topic to begin.',
    },
  ]);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation, pending]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim() || !name.trim() || !topic.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your name, a topic, and a message.',
        variant: 'destructive',
      });
      return;
    }

    setPending(true);
    const userMessage: Message = { role: 'user', content: message };
    setConversation((prev) => [...prev, userMessage]);
    setMessage('');

    try {
      const assistantResponse = await getAssistantResponse(name, topic);
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse,
      };
      setConversation((prev) => [...prev, assistantMessage]);
    } catch (e) {
      toast({
        title: 'An error occurred',
        description: 'Could not get a response. Please try again.',
        variant: 'destructive',
      });
      console.error(e);
      setConversation((prev) => prev.slice(0, prev.length - 1));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-3xl h-[90vh] flex flex-col shadow-2xl shadow-primary/10 rounded-xl">
        <CardHeader className="border-b">
          <CardTitle className="font-headline flex items-center gap-3 text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-6 w-6" />
            </span>
            Contextual Chat
          </CardTitle>
          <CardDescription className="pt-1">
            Enter your name and a topic, then start chatting. I'll do my best
            to respond in context!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
            <div className="p-4 lg:p-6 space-y-6">
              {conversation.map((msg, index) => (
                <ChatMessage
                  key={index}
                  role={msg.role}
                  content={msg.content}
                />
              ))}
              {pending && (
                <div className="group flex items-start gap-3 w-full justify-start">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%] rounded-lg p-3 text-sm shadow-sm animate-in fade-in-20 zoom-in-95 bg-card text-card-foreground rounded-bl-none flex items-center space-x-1.5">
                    <span
                      className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-pulse"
                      style={{ animationDelay: '0ms' }}
                    ></span>
                    <span
                      className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-pulse"
                      style={{ animationDelay: '200ms' }}
                    ></span>
                    <span
                      className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-pulse"
                      style={{ animationDelay: '400ms' }}
                    ></span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  name="topic"
                  placeholder="e.g., Space Exploration"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                name="message"
                placeholder="Type your message..."
                autoComplete="off"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={pending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={pending || !message.trim()}
              >
                {pending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
