
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApiKey } from '@/contexts/ApiKeyContext';
import type { Provider } from '@/contexts/ApiKeyContext';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApiKeySaved: () => void;
}

const PROVIDER_LABEL: Record<Provider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export default function ApiKeyDialog({ isOpen, onOpenChange, onApiKeySaved }: ApiKeyDialogProps) {
  const { toast } = useToast();
  const { selectedProvider, setSelectedProvider, saveApiKey, getApiKey } = useApiKey();

  const [localProvider, setLocalProvider] = React.useState<Provider>(selectedProvider);
  const [apiKey, setApiKey] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    // Sync local state with current selection and its saved key
    setLocalProvider(selectedProvider);
    setApiKey(getApiKey(selectedProvider) ?? '');
  }, [isOpen, selectedProvider, getApiKey]);

  const handleProviderChange = (value: string) => {
    const p = value as Provider;
    setLocalProvider(p);
    setApiKey(getApiKey(p) ?? '');
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'API Key cannot be empty.',
      });
      return;
    }
    // Save the key for the selected provider and set it as the active provider
    saveApiKey(localProvider, apiKey.trim());
    setSelectedProvider(localProvider);

    toast({
      title: 'API Key Saved',
      description: `Your ${PROVIDER_LABEL[localProvider]} API Key has been saved locally.`,
    });
    onApiKeySaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" />
            API Settings
          </DialogTitle>
          <DialogDescription>
            Select a provider and set its API key. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="provider" className="text-right">
              Provider
            </Label>
            <div className="col-span-3">
              <Select value={localProvider} onValueChange={handleProviderChange}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-key" className="text-right">
              API Key
            </Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="col-span-3"
              placeholder={`Enter your ${PROVIDER_LABEL[localProvider]} API Key`}
              type="password"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
