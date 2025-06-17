/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "../../components/ui/dialog";
import { Loader2, FileText, X } from "lucide-react";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { Button } from "../../components/ui/button";

interface DocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentData?: string;
  contentType: string;
  isLoading: boolean;
}

export default function DocumentViewModal({
  isOpen,
  onClose,
  documentName,
  documentData,
  contentType,
  isLoading
}: DocumentViewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!documentData) {
      setObjectUrl(null);
      return;
    }

    let url: string | null = null;
    try {
      const binaryData = atob(documentData);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: contentType });
      url = URL.createObjectURL(blob);
      setObjectUrl(url);
    } catch (error) {
      console.error("Error creating object URL:", error);
      setObjectUrl(null);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [documentData, contentType]);

  const isPdf = contentType === "application/pdf";

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] lg:max-w-[90vw] xl:max-w-[1400px] h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between">
            <div>
                <DialogTitle>{documentName}</DialogTitle>
                <DialogDescription>
                    Expanded document view.
                </DialogDescription>
            </div>
            <DialogClose asChild>
                <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                </Button>
            </DialogClose>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/20 flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading document preview...</p>
              </div>
            ) : objectUrl ? (
              isPdf ? (
                <div className="h-full w-full bg-white">
                  <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                    <Viewer fileUrl={objectUrl} />
                  </Worker>
                </div>
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 text-primary/60 mx-auto mb-4" />
                  <p>This document type ({contentType}) cannot be previewed.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please download the document to view its contents.
                  </p>
                </div>
              )
            ) : (
              <div className="text-center p-8">
                <p className="text-muted-foreground">No document data available for preview.</p>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
} 