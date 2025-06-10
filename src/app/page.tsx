
'use client';

import * as React from 'react';
import { codeReview, type CodeReviewInput } from '@/ai/flows/code-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ScanSearch, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export default function GeminiReviewPage() {
  const [diffContent, setDiffContent] = React.useState<string>('');
  const [fullReview, setFullReview] = React.useState<boolean>(false);
  const [reviewOutput, setReviewOutput] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [accordionValue, setAccordionValue] = React.useState<string>('diff-section');
  const { toast } = useToast();

  const handleGetReview = async () => {
    if (!diffContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Diff content cannot be empty.',
      });
      return;
    }

    setIsLoading(true);
    setAccordionValue(''); // Collapse accordion when review starts
    setReviewOutput('');

    try {
      const input: CodeReviewInput = {
        diff: diffContent,
        fullReview: fullReview,
      };
      const result = await codeReview(input);
      setReviewOutput(result.review);
      toast({
        title: 'Review Complete',
        description: 'Code review successfully generated.',
      });
    } catch (error) {
      console.error('Error getting code review:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to get code review. ${error instanceof Error ? error.message : 'Please try again.'}`,
      });
      setAccordionValue('diff-section'); // Re-open accordion on error
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
                {/* Chevron icon is part of AccordionTrigger */}
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
                  />
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="full-review-switch"
                      checked={fullReview}
                      onCheckedChange={setFullReview}
                      aria-labelledby="full-review-label"
                    />
                    <Label htmlFor="full-review-switch" id="full-review-label">
                      Full Review (includes style & nitpicks)
                    </Label>
                  </div>
                </div>
                <div className="mt-6 flex items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={isLoading || !diffContent.trim()} className="w-full md:w-auto">
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
                          This action will use the Gemini API and may be subject to usage quotas or costs.
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
          <CardDescription>The generated code review will appear below.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col flex-grow">
          {isLoading && accordionValue !== 'diff-section' && ( // Show loader here only if diff is collapsed
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground flex-grow">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p>Generating review, please wait...</p>
            </div>
          )}
          {!isLoading && !reviewOutput && (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-grow">
              <p>Review output will be displayed here.</p>
            </div>
          )}
          {reviewOutput && (
            <ScrollArea className="w-full rounded-md border p-4 bg-secondary/20 flex-grow h-0 min-h-[200px]">
              <pre className="text-sm whitespace-pre-wrap break-words font-code">{reviewOutput}</pre>
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
