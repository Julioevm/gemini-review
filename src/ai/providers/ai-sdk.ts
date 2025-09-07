// Server-side provider factory for Vercel AI SDK

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export type Provider = 'gemini' | 'openai' | 'anthropic';

export const MODEL_IDS = {
  gemini: {
    weak: 'gemini-2.5-flash',
    strong: 'gemini-2.5-pro',
  },
  openai: {
    weak: 'gpt-5-mini',
    strong: 'gpt-5',
  },
  anthropic: {
    weak: 'sonnet-4',
    strong: 'opus-4.1',
  },
} as const;

export function getModel(options: {
  provider: Provider;
  apiKey: string;
  useProModel?: boolean;
}): LanguageModel {
  const { provider, apiKey, useProModel = false } = options;

  switch (provider) {
    case 'gemini': {
      const google = createGoogleGenerativeAI({ apiKey });
      const id = useProModel ? MODEL_IDS.gemini.strong : MODEL_IDS.gemini.weak;
      return google(id);
    }
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      const id = useProModel ? MODEL_IDS.openai.strong : MODEL_IDS.openai.weak;
      return openai(id);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      const id = useProModel ? MODEL_IDS.anthropic.strong : MODEL_IDS.anthropic.weak;
      return anthropic(id);
    }
    default: {
      // Exhaustiveness check
      const _never: never = provider as never;
      throw new Error(`Unsupported provider: ${String(_never)}`);
    }
  }
}

export function getModelLabel(provider: Provider, useProModel: boolean): string {
  const map = MODEL_IDS[provider];
  return useProModel ? map.strong : map.weak;
}