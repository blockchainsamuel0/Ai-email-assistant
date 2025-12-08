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
import { Textarea } from '@/components/ui/textarea';
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
        'Welcome! Fill out the fields below and I will generate an email for you.',
    },
  ]);
  const [yourName, setYourName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [request, setRequest] = useState('');
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

    if (!request.trim() || !yourName.trim() || !recipientName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all fields.',
        variant: 'destructive',
      });
      return;
    }

    setPending(true);
    const userMessage: Message = { role: 'user', content: request };
    setConversation((prev) => [...prev, userMessage]);

    try {
      const assistantResponse = await getAssistantResponse(yourName, recipientName, request);
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
            AI Email Assistant
          </CardTitle>
          <CardDescription className="pt-1">
            Your smart email drafting assistant.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="yourName">Your Name</Label>
                <Input
                  id="yourName"
                  name="yourName"
                  placeholder="e.g., Jane Doe"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="recipientName">Recipient's Name</Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  placeholder="e.g., John Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="request">What do you want?</Label>
              <Textarea
                id="request"
                name="request"
                placeholder="e.g., follow up on the meeting and confirm next steps..."
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                required
                disabled={pending}
                className="min-h-[60px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={pending || !request.trim()}
              >
                {pending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                 <> <Send className="h-5 w-5" /> Generate Email </>
                )}
                <span className="sr-only">Generate Email</span>
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
