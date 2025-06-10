
'use client';

import { Bot, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const handleSetApiKey = () => {
    // TODO: Implement API key dialog opening logic
    alert('Set API Key button clicked. Functionality to be implemented.');
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Bot className="h-7 w-7 text-primary" />
          <span className="font-headline text-xl font-semibold text-foreground">
            Gemini Review
          </span>
        </Link>
        <Button variant="outline" size="sm" onClick={handleSetApiKey}>
          <KeyRound className="mr-2 h-4 w-4" />
          Set API Key
        </Button>
      </div>
    </header>
  );
}
