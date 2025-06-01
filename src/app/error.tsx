
"use client"; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="bg-card p-8 rounded-lg shadow-xl max-w-md text-center border border-destructive/50">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
        <h2 className="text-2xl font-headline font-semibold text-destructive-foreground mb-4">
          Oops! Something went wrong.
        </h2>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected issue. Please try again, or contact support if the problem persists.
        </p>
        {error?.message && (
          <p className="text-sm text-muted-foreground/80 mb-2">Error details: {error.message}</p>
        )}
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
