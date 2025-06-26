
"use client";

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import EditorPageComponent from '@/components/editor/editor-page-client';


export default function EditorPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading editor...</p>
        </div>
      }
    >
      <EditorPageComponent />
    </Suspense>
  );
}
