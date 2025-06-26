"use client";

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wand2, X, Send, Bot, User } from "lucide-react";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AiChatAssistantProps {
  onPromptSubmit: (prompt: string) => Promise<string | null>;
  isProcessing: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AiChatAssistant({ onPromptSubmit, isProcessing }: AiChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! How can I help you build your website today? Try 'add a hero section' or 'change the background to light gray'." }
  ]);
  const [userInput, setUserInput] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    const prompt = userInput;
    setUserInput("");

    const aiResponse = await onPromptSubmit(prompt);

    if (aiResponse) {
      setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
    } else {
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
      toast({
        title: 'AI Error',
        description: 'Could not get a response from the AI assistant.',
        variant: 'destructive'
      });
    }
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <Wand2 className="h-7 w-7" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out">
      <header className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h3 className="font-headline font-semibold text-lg">AI Assistant</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
      </header>
      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef as any}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
              {msg.role === 'assistant' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>}
              <div className={cn("p-3 rounded-lg max-w-[85%]", msg.role === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                <p className="text-sm">{msg.content}</p>
              </div>
               {msg.role === 'user' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>}
            </div>
          ))}
           {isProcessing && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>
              <div className="p-3 rounded-lg bg-muted flex items-center">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse mr-1.5" />
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse delay-200 mr-1.5" />
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse delay-400" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-3 border-t flex items-center gap-2">
        <Input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="e.g., Add a contact form"
          className="flex-1 bg-input"
          disabled={isProcessing}
        />
        <Button type="submit" size="icon" disabled={isProcessing || !userInput.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
