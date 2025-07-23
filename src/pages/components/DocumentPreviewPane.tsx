import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { FileText, Expand, Loader2, CheckCircle, Clock } from "lucide-react";
import { type DocumentInfo } from "../../types/types";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { Badge } from "../../components/ui/badge";

interface DocumentPreviewPaneProps {
  selectedDocument: DocumentInfo | null;
  viewerDocuments: any[];
  isDecrypting: boolean;
  isPreparingView: boolean;
  onExpandView: () => void;
}

export default function DocumentPreviewPane({
  selectedDocument,
  viewerDocuments,
  isDecrypting,
  isPreparingView,
  onExpandView
}: DocumentPreviewPaneProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Handle document data conversion to object URL
  useEffect(() => {
    if (viewerDocuments.length === 0) {
      setObjectUrl(null);
      return;
    }

    const document = viewerDocuments[0];
    if (!document?.uri) {
      setObjectUrl(null);
      return;
    }

    // If it's already a data URI, convert to blob URL for PDF viewer
    if (document.uri.startsWith('data:')) {
      try {
        const byteCharacters = atob(document.uri.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: selectedDocument?.contentType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch (error) {
        console.error('Failed to convert data URI to blob URL:', error);
        setObjectUrl(null);
      }
    } else {
      setObjectUrl(document.uri);
    }
  }, [viewerDocuments, selectedDocument?.contentType]);

  // Cleanup object URL when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const isPdf = selectedDocument?.contentType === "application/pdf";
  
  // Check if document has signature information
  const hasSignatureInfo = selectedDocument?.emailToSign && selectedDocument?.signature;
  // const isSignaturePending = selectedDocument?.emailToSign && selectedDocument?.signed === "false";
  const isSignatureComplete = selectedDocument?.emailToSign && selectedDocument?.signed === "true";

  return (
    <div className="h-[35%] mb-3 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">Document Preview</h3>
        <div className="flex items-center gap-2">
          {hasSignatureInfo && (
            <Badge variant={isSignatureComplete ? "default" : "secondary"} className="text-xs">
              {isSignatureComplete ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Signed
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </>
              )}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onExpandView}
            disabled={!selectedDocument || isPreparingView}
            title="Expand View"
          >
            {isPreparingView ? <Loader2 className="h-4 w-4 animate-spin" /> : <Expand className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 border rounded-lg overflow-hidden bg-background">
          {isDecrypting ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Retrieving Document...</p>
            </div>
          ) : objectUrl && isPdf ? (
            <div className="h-full w-full">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer fileUrl={objectUrl} />
              </Worker>
            </div>
          ) : objectUrl && !isPdf ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <FileText className="h-16 w-16 text-primary/60 mb-4" />
              <p className="text-center text-muted-foreground">
                This document type ({selectedDocument?.contentType}) cannot be previewed.
              </p>
              <p className="text-center text-muted-foreground text-sm mt-2">
                Use the expand button to open in a larger view or download the document.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg p-6">
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-center text-muted-foreground">
                Select a document to preview its contents here.
              </p>
              <p className="text-center text-muted-foreground text-sm mt-2">
                Supported formats include PDF, DOCX, PPTX, and more.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 