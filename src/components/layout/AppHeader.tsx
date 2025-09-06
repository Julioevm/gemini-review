
'use client';

import * as React from 'react';
import { Bot, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ApiKeyDialog from '@/components/ApiKeyDialog';
import { useApiKey } from '@/contexts/ApiKeyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AppHeader() {
  const [isApiDialogOpen, setIsApiDialogOpen] = React.useState(false);
  const {
    refreshApiKey,
    isApiKeySet,
    selectedProvider,
    setSelectedProvider,
    hasMultipleProvidersWithKeys,
  } = useApiKey();

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
          <div className="flex items-center gap-2">
            {hasMultipleProvidersWithKeys && (
              <Select
                value={selectedProvider}
                onValueChange={(v) => setSelectedProvider(v as any)}
              >
                <SelectTrigger className="w-[130px]" aria-label="AI Provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size={isApiKeySet ? 'icon' : 'sm'}
              onClick={() => setIsApiDialogOpen(true)}
              title={isApiKeySet ? 'Update API Key' : 'Set API Key'}
            >
              <KeyRound className="h-4 w-4" />
              {!isApiKeySet && <span>Set API Key</span>}
            </Button>
          </div>
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
