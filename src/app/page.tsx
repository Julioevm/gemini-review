
'use client';

import * as React from 'react';
import { codeReview, type CodeReviewInput } from '@/ai/flows/code-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ScanSearch, AlertTriangle, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription as UIDescription, AlertTitle as UITitle } from "@/components/ui/alert";
import { useApiKey } from '@/contexts/ApiKeyContext'; // Import the hook

export default function GeminiReviewPage() {
  const [diffContent, setDiffContent] = React.useState<string>('');
  const [fullReview, setFullReview] = React.useState<boolean>(false);
  const [useProModel, setUseProModel] = React.useState<boolean>(false);
  const [reviewOutput, setReviewOutput] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [accordionValue, setAccordionValue] = React.useState<string>('diff-section');
  const { toast } = useToast();
  
  const { apiKey, isApiKeySet } = useApiKey(); // Use the context

  const handleGetReview = async () => {
    // API key is now sourced from context via `apiKey` and `isApiKeySet`
    if (!isApiKeySet || !apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Missing',
        description: 'Please set your Gemini API Key using the button in the header.',
      });
      return;
    }

    if (!diffContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Diff content cannot be empty.',
      });
      return;
    }

    setIsLoading(true);
    setAccordionValue(''); 
    setReviewOutput('');

    try {
      const input: CodeReviewInput = {
        diff: diffContent,
        fullReview: fullReview,
        useProModel: useProModel,
        apiKey: apiKey, // Pass the API key from context
      };
      const result = await codeReview(input);
      setReviewOutput(result.review);
      toast({
        title: 'Review Complete',
        description: `Code review successfully generated using ${useProModel ? "Gemini 2.5 Pro" : "Gemini 2.5 Flash"}.`,
      });
    } catch (error) {
      console.error('Error getting code review:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to get code review. ${error instanceof Error ? error.message : 'Please try again.'}`,
      });
      setAccordionValue('diff-section'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReview = () => {
    if (!reviewOutput) return;
    const blob = new Blob([reviewOutput], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gemini_code_review.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({
      title: 'Review Saved',
      description: 'Review downloaded as gemini_code_review.md.',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col flex-grow gap-6">
      {!isApiKeySet && (
         <Alert variant="destructive" className="mt-4">
          <Info className="h-4 w-4" />
          <UITitle>API Key Required</UITitle>
          <UIDescription>
            Please set your Gemini API Key using the &quot;Set API Key&quot; button in the header to enable code reviews.
          </UIDescription>
        </Alert>
      )}
      <Accordion type="single" collapsible className="w-full" value={accordionValue} onValueChange={setAccordionValue}>
        <AccordionItem value="diff-section" className="border-0">
          <Card className="shadow-lg">
            <AccordionTrigger className="p-0 hover:no-underline focus:outline-none w-full data-[state=open]:bg-transparent data-[state=closed]:bg-transparent rounded-t-lg">
              <div className="flex items-center justify-between p-6 w-full">
                <div className="flex flex-col space-y-1.5 text-left">
                  <CardTitle className="font-headline text-2xl">Paste Your Diff</CardTitle>
                  <CardDescription>
                    Enter the diff content to review. {accordionValue === 'diff-section' ? 'Click header to collapse.' : 'Click header to expand.'}
                  </CardDescription>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-6 pt-0">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste your git diff here..."
                    value={diffContent}
                    onChange={(e) => setDiffContent(e.target.value)}
                    className="min-h-[200px] text-sm font-code md:min-h-[250px]"
                    aria-label="Diff content input"
                    disabled={!isApiKeySet}
                  />
                  <div className="flex flex-col space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="full-review-switch"
                        checked={fullReview}
                        onCheckedChange={setFullReview}
                        aria-labelledby="full-review-label"
                        disabled={!isApiKeySet}
                      />
                      <Label htmlFor="full-review-switch" id="full-review-label" className={!isApiKeySet ? 'text-muted-foreground' : ''}>
                        Full Review (includes style & nitpicks)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="pro-model-switch"
                        checked={useProModel}
                        onCheckedChange={setUseProModel}
                        aria-labelledby="pro-model-label"
                        disabled={!isApiKeySet}
                      />
                      <Label htmlFor="pro-model-switch" id="pro-model-label" className={!isApiKeySet ? 'text-muted-foreground' : ''}>
                        Use Pro Model (Gemini 2.5 Pro)
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={isLoading || !diffContent.trim() || !isApiKeySet} className="w-full md:w-auto">
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ScanSearch className="mr-2 h-4 w-4" />
                        )}
                        Get Review
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                           <AlertTriangle className="mr-2 h-5 w-5 text-accent" />
                          Confirm Review Request
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          You are about to submit the provided diff content for AI-powered code review.
                          This action will use the Gemini API ({useProModel ? "Gemini 1.5 Pro" : "Gemini 2.0 Flash"}) with your provided API Key.
                          Do you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGetReview} disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Confirm & Review
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      <Card className="shadow-lg flex flex-col flex-grow">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Review Results</CardTitle>
          <CardDescription>
            The generated code review will appear below. Model used: {useProModel ? "Gemini 1.5 Pro" : "Gemini 2.0 Flash"}.
            {!isApiKeySet && <span className="text-destructive"> (API Key not set)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col flex-grow">
          {isLoading && accordionValue !== 'diff-section' && ( 
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground flex-grow">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p>Generating review, please wait...</p>
            </div>
          )}
          {!isLoading && !reviewOutput && (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-grow">
              <p>{isApiKeySet ? "Review output will be displayed here." : "Set your API Key to generate reviews."}</p>
            </div>
          )}
          {reviewOutput && (
            <ScrollArea className="w-full rounded-md border p-4 bg-secondary/20 flex-grow h-0 min-h-[200px]">
              <ReactMarkdown
                className="prose prose-sm dark:prose-invert max-w-none"
                components={{
                  pre: ({node, ...props}) => <pre className="font-code bg-muted p-2 rounded-md" {...props} />,
                  code: ({node, inline, ...props}) => <code className={`font-code ${inline ? 'bg-muted px-1 py-0.5 rounded-sm' : ''}`} {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-2xl font-headline mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-headline mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-headline mb-1" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1" {...props} />,
                  a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                }}
              >
                {reviewOutput}
              </ReactMarkdown>
            </ScrollArea>
          )}
        </CardContent>
        {reviewOutput && !isLoading && (
          <CardFooter>
            <Button onClick={handleSaveReview} variant="outline" className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Save Review as .md
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
