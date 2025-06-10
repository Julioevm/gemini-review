'use client';

import { Bot } from 'lucide-react';
import Link from 'next/link';

export default function AppHeader() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Bot className="h-7 w-7 text-primary" />
          <span className="font-headline text-xl font-semibold text-foreground">
            Gemini Review
          </span>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
