
'use client';

import * as React from 'react';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

interface ApiKeyContextType {
  apiKey: string | null;
  refreshApiKey: () => void;
  isApiKeySet: boolean;
}

const ApiKeyContext = React.createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = React.useState<string | null>(null);

  const refreshApiKey = React.useCallback(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    setApiKey(storedApiKey);
  }, []);

  React.useEffect(() => {
    refreshApiKey(); // Initial load
    
    // Listen for storage changes from other tabs/windows if desired,
    // though for same-page, direct refresh is more reliable.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === API_KEY_STORAGE_KEY) {
        refreshApiKey();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, [refreshApiKey]);

  const isApiKeySet = !!apiKey;

  return (
    <ApiKeyContext.Provider value={{ apiKey, refreshApiKey, isApiKeySet }}>
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
