import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { UploadCloud, Eye, Download, Loader2 } from "lucide-react";
import { type DocumentInfo, type RoomDetails } from "../../types/types";

interface AllDocumentsPaneProps {
  roomDetails: RoomDetails;
  documents: DocumentInfo[];
  allowedUploadCategories: string[];
  isViewingDoc: string | null;
  isDownloadingDoc: string | null;
  onViewDocument: (documentId: string) => void;
  onDownloadDocument: (documentId: string) => void;
  onOpenUploadModal: (category: string) => void;
}

export default function AllDocumentsPane({
  roomDetails,
  documents,
  allowedUploadCategories,
  isViewingDoc,
  isDownloadingDoc,
  onViewDocument,
  onDownloadDocument,
  onOpenUploadModal
}: AllDocumentsPaneProps) {
  const sortedRoles = [...roomDetails.roomRoles]
    .filter(role => role.documentTypes.length > 0)
    .sort((a, b) => {
      if (a.roleName === 'founder') return -1;
      if (b.roleName === 'founder') return 1;
      return a.roleName.localeCompare(b.roleName);
    });

  const defaultOpenRoles = sortedRoles.map(role => role.roleName);

  return (
    <div className="w-1/2 border-r p-3 overflow-y-auto">
      <h3 className="font-medium mb-3 text-sm">All Documents</h3>
      <Accordion type="multiple" defaultValue={defaultOpenRoles} className="w-full">
        {sortedRoles.map(role => (
          <AccordionItem value={role.roleName} key={role.roleName} className="border-b-0">
            <AccordionTrigger className="text-sm font-medium capitalize hover:no-underline px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
              {role.roleName.replace(/_/g, ' ')}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-0 pl-3">
              <div className="space-y-1 py-1">
                {role.documentTypes.map(docType => {
                  const docsInCategory = documents.filter(doc => doc.category === docType);
                  const latestDoc = docsInCategory.length > 0 ? docsInCategory.sort((a,b) => b.uploadedAt - a.uploadedAt)[0] : null;

                  let statusNode = null;
                  if (latestDoc) {
                    const allSignersForDoc = documents.filter(doc => doc.documentId === latestDoc.documentId);
                    const isVerified = allSignersForDoc.length > 0 && allSignersForDoc.every(doc => doc.signed === "true");
                    const statusColor = isVerified ? "bg-green-500" : "bg-yellow-500";
                    statusNode = (
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-1.5 ${statusColor}`}
                          title={isVerified ? "Verified" : "Pending verification"}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onViewDocument(latestDoc.documentId)} 
                          disabled={!!isViewingDoc || !!isDownloadingDoc} 
                          title="View" 
                          className="h-7 w-7"
                        >
                          {isViewingDoc === latestDoc.documentId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDownloadDocument(latestDoc.documentId)} 
                          disabled={!!isViewingDoc || !!isDownloadingDoc} 
                          title="Download" 
                          className="h-7 w-7"
                        >
                          {isDownloadingDoc === latestDoc.documentId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        </Button>
                      </div>
                    );
                  } else if (allowedUploadCategories.includes(docType)) {
                    statusNode = (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-primary/70 hover:bg-primary/10 hover:text-primary" 
                        title={`Upload ${docType.replace(/_/g, ' ')}`} 
                        onClick={() => onOpenUploadModal(docType)}
                      >
                        <UploadCloud className="h-4 w-4" />
                      </Button>
                    );
                  } else {
                    statusNode = <div className="h-7 w-7" />;
                  }

                  return (
                    <div key={docType} className="flex items-center justify-between pl-2 pr-1 py-1 rounded-md transition-colors duration-150 hover:bg-accent">
                      <span className={`capitalize text-sm ${!latestDoc ? 'text-muted-foreground/80' : 'text-foreground'}`}>
                        {docType.replace(/_/g, ' ')}
                      </span>
                      {statusNode}
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 