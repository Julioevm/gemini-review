
'use client';

import * as React from 'react';

export type Provider = 'gemini' | 'openai' | 'anthropic';

const STORAGE_SELECTED_PROVIDER = 'ai_provider';
const STORAGE_KEYS: Record<Provider, string> = {
  gemini: 'gemini_api_key',
  openai: 'openai_api_key',
  anthropic: 'anthropic_api_key',
};

function isProvider(value: unknown): value is Provider {
  return value === 'gemini' || value === 'openai' || value === 'anthropic';
}

interface ApiKeyContextType {
  // Current (selected) provider and its API key
  selectedProvider: Provider;
  setSelectedProvider: (p: Provider) => void;

  apiKey: string | null; // API key for selected provider
  isApiKeySet: boolean;
  refreshApiKey: () => void;

  // Provider-aware helpers
  saveApiKey: (p: Provider, key: string) => void;
  getApiKey: (p: Provider) => string | null;

  // UI hint: show quick selector if 2+ providers have keys saved
  hasMultipleProvidersWithKeys: boolean;
}

const ApiKeyContext = React.createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [selectedProvider, setSelectedProviderState] = React.useState<Provider>('gemini');
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [hasMultipleProvidersWithKeys, setHasMultipleProvidersWithKeys] = React.useState(false);

  const loadSelectedProviderFromStorage = React.useCallback((): Provider => {
    const stored = localStorage.getItem(STORAGE_SELECTED_PROVIDER);
    if (isProvider(stored)) return stored;

    // Backward compatibility: if only Gemini key exists from previous versions
    const geminiKey = localStorage.getItem(STORAGE_KEYS.gemini);
    if (geminiKey) return 'gemini';

    // Default
    return 'gemini';
  }, []);

  const recalcState = React.useCallback((prov?: Provider) => {
    const provider = prov ?? selectedProvider;
    const key = localStorage.getItem(STORAGE_KEYS[provider]);
    setApiKey(key);

    let count = 0;
    (['gemini', 'openai', 'anthropic'] as Provider[]).forEach(p => {
      if (localStorage.getItem(STORAGE_KEYS[p])) count++;
    });
    setHasMultipleProvidersWithKeys(count >= 2);
  }, [selectedProvider]);

  React.useEffect(() => {
    const initialProvider = loadSelectedProviderFromStorage();
    setSelectedProviderState(initialProvider);
    recalcState(initialProvider);

    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key) return;

      if (event.key === STORAGE_SELECTED_PROVIDER) {
        const p = loadSelectedProviderFromStorage();
        setSelectedProviderState(p);
        recalcState(p);
        return;
      }

      if (Object.values(STORAGE_KEYS).includes(event.key)) {
        recalcState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSelectedProviderFromStorage, recalcState]);

  const refreshApiKey = React.useCallback(() => {
    recalcState();
  }, [recalcState]);

  const setSelectedProvider = (p: Provider) => {
    setSelectedProviderState(p);
    localStorage.setItem(STORAGE_SELECTED_PROVIDER, p);
    recalcState(p);
  };

  const saveApiKey = (p: Provider, key: string) => {
    localStorage.setItem(STORAGE_KEYS[p], key);
    if (p === selectedProvider) {
      setApiKey(key);
    }
    recalcState(p);
  };

  const getApiKey = (p: Provider) => localStorage.getItem(STORAGE_KEYS[p]);

  const isApiKeySet = !!apiKey;

  return (
    <ApiKeyContext.Provider
      value={{
        selectedProvider,
        setSelectedProvider,
        apiKey,
        isApiKeySet,
        refreshApiKey,
        saveApiKey,
        getApiKey,
        hasMultipleProvidersWithKeys,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = React.useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
