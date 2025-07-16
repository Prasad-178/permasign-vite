import { Button } from "../../components/ui/button";
import { FileText, Expand, Loader2 } from "lucide-react";
import { type DocumentInfo } from "../../types/types";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

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
  return (
    <div className="h-1/2 mb-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">Document Preview</h3>
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
      <div className="h-[calc(100%-2rem)] border rounded-lg overflow-hidden bg-background">
        {isDecrypting ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Retrieving Document...</p>
          </div>
        ) : viewerDocuments.length > 0 ? (
          <DocViewer
            documents={viewerDocuments}
            pluginRenderers={DocViewerRenderers}
            config={{
              header: {
                disableHeader: true,
                disableFileName: true,
                retainURLParams: false
              }
            }}
            style={{ height: '100%' }}
          />
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
  );
} 