
'use client';

import * as React from 'react';
import { Bot, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ApiKeyDialog from '@/components/ApiKeyDialog';
import { useApiKey } from '@/contexts/ApiKeyContext';

export default function AppHeader() {
  const [isApiDialogOpen, setIsApiDialogOpen] = React.useState(false);
  const { refreshApiKey } = useApiKey();

  const handleApiKeySaved = () => {
    refreshApiKey(); // Refresh the API key in the context
    // The dialog will close itself via onOpenChange from its own save handler
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
