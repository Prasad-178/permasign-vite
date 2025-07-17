/* eslint-disable react-hooks/exhaustive-deps */
// app/rooms/[roomId]/components/modals/DocumentSigningModal.tsx
"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Loader2, FileText } from "lucide-react";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface DocumentSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  documentData?: string;
  contentType: string;
  isSigning: boolean;
  onSign: (documentId: string) => Promise<void>;
}

export default function DocumentSigningModal({
  isOpen,
  onClose,
  documentId,
  documentName,
  documentData,
  contentType,
  isSigning,
  onSign
}: DocumentSigningModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signerName, setSignerName] = useState("");

  // Effect to reset state and manage document processing
  useEffect(() => {
    // When the modal is not open, do nothing.
    if (!isOpen) {
      return;
    }
    
    // When modal opens, reset the signer name.
    setSignerName("");

    // If there's no document data yet, show loader and clear any old object URL.
    if (!documentData) {
      setIsLoading(true);
      setObjectUrl(null);
      return;
    }

    // If data is present, process it.
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }

    // Cleanup function to revoke object URL when the effect re-runs or component unmounts.
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, documentData, contentType]);

  const handleSign = async () => {
    try {
      await onSign(documentId);
      // Close the modal only after successful signing
      onClose();
    } catch (error) {
      console.error("Error during document signing:", error);
      // Modal stays open if there's an error, allowing the user to try again
    }
  };

  const isPdf = contentType === "application/pdf";

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] lg:max-w-[90vw] xl:max-w-[1400px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Sign Document: {documentName}</DialogTitle>
          <DialogDescription>
            Please review the document carefully before signing
          </DialogDescription>
        </DialogHeader>

        {/* Main content area with side-by-side layout */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left side - Document preview */}
          <div className="md:w-3/4 flex-1 min-h-[80vh] overflow-hidden bg-muted/20 flex items-center justify-center">
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
          
          {/* Right side - Signature section */}
          <div className="md:w-1/4 border-t md:border-t-0 md:border-l border-border p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Your Signature</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signer-name" className="block mb-2 text-sm font-medium">
                    Enter your full name to sign
                  </Label>
                  <Input
                    id="signer-name"
                    name="signer-display-name"
                    value={signerName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignerName(e.target.value)}
                    placeholder="Type your full name here"
                    className="w-full"
                    disabled={isSigning}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>
                
                {signerName && (
                  <div>
                    <Label className="block mb-2 text-sm font-medium">
                      Preview
                    </Label>
                    <div className="border rounded-md p-4 bg-white min-h-16 flex items-center justify-center">
                      <p className="font-signature text-3xl text-primary">
                        {signerName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-auto">
              <p className="text-xs text-muted-foreground mb-4">
                By clicking &quot;PermaSign Document&quot;, you confirm that you have reviewed the document and agree to sign it electronically. Learn more about our{" "}
                <a 
                  href="/#/security" 
                  className="text-blue-600 hover:text-blue-800 underline hover:no-underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  security process
                </a>
                .
              </p>
              
              <Button 
                onClick={handleSign} 
                disabled={isSigning || !documentData || !signerName.trim()}
                className="relative overflow-hidden rounded-full px-6 py-2"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  'PermaSign Document'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
