
'use client';

import * as React from 'react';
import { codeReview, type CodeReviewInput } from '@/ai/flows/code-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ScanSearch, AlertTriangle, Info, RotateCcw, Upload } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription as UIDescription, AlertTitle as UITitle } from "@/components/ui/alert";
import { useApiKey } from '@/contexts/ApiKeyContext';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';


const DEFAULT_REVIEW_PROMPT = `You are an expert Senior Software Engineer performing a code review.
Your goal is to provide constructive feedback to improve the quality, maintainability, and correctness of the code.

Please analyze the following code diff and focus on:
1.  **Bugs and Potential Errors:** Identify any logical flaws, off-by-one errors, race conditions, or other potential bugs.
2.  **Security Vulnerabilities:** Check for common security issues (e.g., XSS, SQL injection, insecure handling of secrets).
3.  **Performance Issues:** Point out any inefficient code, unnecessary computations, or potential bottlenecks.
4.  **Code Clarity and Readability:** Is the code easy to understand? Are variable and function names clear? Is the logic straightforward?
5.  **Maintainability and Design:** Does the code follow good design principles (e.g., SOLID, DRY)? Are there overly complex sections that could be refactored?
6.  **Best Practices and Idioms:** Does the code adhere to language-specific best practices and common coding patterns?
7.  **Testability:** Is the code structured in a way that makes it easy to write unit tests?
8.  **Documentation:** Are comments clear and helpful? Is there a need for more documentation?

Structure your review:
- Don't start by mentioning markdown or \`\`\` (code block) simply output the review using markdown style.
- Group feedback by file: Start by showing the file name with Header 3 like ### File: path/to/file and finish each file section with --- to clearly separate them.
- For each point, clearly explain the issue and suggest specific improvements or alternatives.
- If suggesting code changes, provide them in a code block.
- Prioritize actionable feedback.

Avoid commenting on:
- Purely stylistic preferences unless they significantly impact readability (e.g., inconsistent formatting that makes code hard to follow).
- Trivial or overly pedantic nitpicks that don't add substantial value.
- Files without any issue or comment you can skip entirely.`;

const CUSTOM_REVIEW_PROMPT_STORAGE_KEY = 'custom_review_prompt_v2';
const SKIP_CONFIRMATION_STORAGE_KEY = 'gemini_review_skip_confirmation_v1';

export default function GeminiReviewPage() {
  const [diffContent, setDiffContent] = React.useState<string>('');
  const [reviewPrompt, setReviewPrompt] = React.useState<string>(DEFAULT_REVIEW_PROMPT);
  const [useProModel, setUseProModel] = React.useState<boolean>(false);
  const [reviewOutput, setReviewOutput] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [accordionValue, setAccordionValue] = React.useState<string>('diff-section');
  const { toast } = useToast();
  
  const { apiKey, isApiKeySet } = useApiKey();
  const [skipReviewConfirmation, setSkipReviewConfirmation] = React.useState<boolean>(false);
  const [dialogDontAskAgainChecked, setDialogDontAskAgainChecked] = React.useState<boolean>(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  React.useEffect(() => {
    const storedPrompt = localStorage.getItem(CUSTOM_REVIEW_PROMPT_STORAGE_KEY);
    if (storedPrompt) {
      setReviewPrompt(storedPrompt);
    }
    const storedSkipConfirmation = localStorage.getItem(SKIP_CONFIRMATION_STORAGE_KEY);
    if (storedSkipConfirmation === 'true') {
      setSkipReviewConfirmation(true);
      setDialogDontAskAgainChecked(true); 
    }
  }, []);

  const handleReviewPromptChange = (newPrompt: string) => {
    setReviewPrompt(newPrompt);
    localStorage.setItem(CUSTOM_REVIEW_PROMPT_STORAGE_KEY, newPrompt);
  };

  const handleResetPrompt = () => {
    setReviewPrompt(DEFAULT_REVIEW_PROMPT);
    localStorage.setItem(CUSTOM_REVIEW_PROMPT_STORAGE_KEY, DEFAULT_REVIEW_PROMPT);
    toast({
      title: 'Review Instructions Reset',
      description: 'Instructions have been reset to the default.',
    });
  };

  const performReview = async () => {
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
    if (!reviewPrompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Review instructions cannot be empty.',
      });
      return;
    }

    setIsLoading(true);
    setAccordionValue(''); 
    setReviewOutput('');

    try {
      const input: CodeReviewInput = {
        diff: diffContent,
        reviewInstructions: reviewPrompt,
        useProModel: useProModel,
        apiKey: apiKey,
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

  const handleInitiateReview = () => {
    if (skipReviewConfirmation) {
      performReview();
    } else {
      setIsConfirmationDialogOpen(true);
    }
  };

  const handleConfirmAndProceed = () => {
    if (dialogDontAskAgainChecked) {
      localStorage.setItem(SKIP_CONFIRMATION_STORAGE_KEY, 'true');
      setSkipReviewConfirmation(true);
    }
    setIsConfirmationDialogOpen(false);
    performReview();
  };


  const handleSaveReview = () => {
    if (!reviewOutput) return;
    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `gemini_code_review_${currentDate}.md`;
    const blob = new Blob([reviewOutput], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({
      title: 'Review Saved',
      description: `Review downloaded as ${filename}.`,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (event.target) {
      event.target.value = '';
    }

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result;
      if (typeof fileContent === 'string') {
        if (fileContent.includes('\u0000')) {
          toast({
            variant: 'destructive',
            title: 'Invalid File',
            description: 'The uploaded file appears to be a binary file. Please upload a plain text diff file.',
          });
          return;
        }
        setDiffContent(fileContent);
        toast({
          title: 'File Uploaded',
          description: `Successfully loaded content from ${file.name}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'File Read Error',
          description: 'Could not read the file content as text.',
        });
      }
    };

    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'File Read Error',
        description: 'An error occurred while reading the file. Please ensure it is a valid text file.',
      });
    };

    reader.readAsText(file);
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
                  <CardTitle className="font-headline text-2xl">Configure Review</CardTitle>
                  <CardDescription>
                    Paste diff, set instructions, and choose model. {accordionValue === 'diff-section' ? 'Click header to collapse.' : 'Click header to expand.'}
                  </CardDescription>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-6 pt-0">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="diff-content" className="text-base font-medium">Diff Content</Label>
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={!isApiKeySet}>
                          <Upload className="mr-2 h-3 w-3" />
                          Upload File
                      </Button>
                      <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange} 
                          className="hidden"
                          accept=".diff,.patch,.txt,text/plain"
                      />
                    </div>
                    <Textarea
                      id="diff-content"
                      placeholder="Paste your git diff here or upload a file..."
                      value={diffContent}
                      onChange={(e) => setDiffContent(e.target.value)}
                      className="min-h-[150px] text-sm font-code md:min-h-[200px]"
                      aria-label="Diff content input"
                      disabled={!isApiKeySet}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="review-instructions" className="text-base font-medium">Review Instructions</Label>
                      <Button variant="outline" size="sm" onClick={handleResetPrompt} disabled={!isApiKeySet || reviewPrompt === DEFAULT_REVIEW_PROMPT}>
                        <RotateCcw className="mr-2 h-3 w-3" />
                        Reset
                      </Button>
                    </div>
                    <Textarea
                      id="review-instructions"
                      placeholder="Enter your code review instructions here..."
                      value={reviewPrompt}
                      onChange={(e) => handleReviewPromptChange(e.target.value)}
                      className="min-h-[200px] text-sm md:min-h-[250px]"
                      aria-label="Review instructions input"
                      disabled={!isApiKeySet}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
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
                <div className="mt-8 flex items-center">
                  <Button 
                    onClick={handleInitiateReview} 
                    disabled={isLoading || !diffContent.trim() || !reviewPrompt.trim() || !isApiKeySet} 
                    className="w-full md:w-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ScanSearch className="mr-2 h-4 w-4" />
                    )}
                    Get Review
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      <AlertDialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-accent" />
              Confirm Review Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit the provided diff content and review instructions for AI-powered code review.
              This action will use the {useProModel ? "Gemini 2.5 Pro" : "Gemini 2.5 Flash"} model with your provided API Key.
              Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 mt-2 mb-2">
            <Checkbox
              id="dont-ask-again"
              checked={dialogDontAskAgainChecked}
              onCheckedChange={(checked) => setDialogDontAskAgainChecked(Boolean(checked))}
            />
            <Label htmlFor="dont-ask-again" className="text-sm font-normal">
              Don&apos;t ask me again
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmationDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAndProceed} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm & Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Card className="shadow-lg flex flex-col flex-grow">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Review Results</CardTitle>
          <CardDescription>
            The generated code review will appear below. Model used: {useProModel ? "Gemini 2.5 Pro" : "Gemini 2.5 Flash"}.
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
            <div className="w-full rounded-md border p-4 bg-secondary/20 flex-grow min-h-[200px]">
              <ReactMarkdown
                className="prose prose-sm dark:prose-invert max-w-none"
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({node, ...props}) => <code className="bg-secondary/40 rounded-md px-1 font-mono text-muted-foreground" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-2xl font-headline mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-headline mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-headline mb-1" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1" {...props} />,
                  a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-4" {...props} />
                }}
              >
                {reviewOutput}
              </ReactMarkdown>
            </div>
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
