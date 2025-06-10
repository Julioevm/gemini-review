
'use client';

import * as React from 'react';
import { Bot, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ApiKeyDialog from '@/components/ApiKeyDialog'; // Import the new dialog

export default function AppHeader() {
  const [isApiDialogOpen, setIsApiDialogOpen] = React.useState(false);

  // This function will be called by ApiKeyDialog when a key is saved.
  // It can be used to trigger a re-fetch of the key in the page if needed,
  // but for now, page.tsx reads from localStorage on demand.
  const handleApiKeySaved = () => {
    // For now, just log or could trigger a global state update if complex state mgmt was in use
    console.log('API Key was saved, page components should re-check localStorage on next action.');
  };

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            <span className="font-headline text-xl font-semibold text-foreground">
              Gemini Review
            </span>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setIsApiDialogOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Set API Key
          </Button>
        </div>
      </header>
      <ApiKeyDialog
        isOpen={isApiDialogOpen}
        onOpenChange={setIsApiDialogOpen}
        onApiKeySaved={handleApiKeySaved}
      />
    </>
  );
}
