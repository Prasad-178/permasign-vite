import { Button } from "../../components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import { type DocumentInfo, type RoomDetails } from "../../types/types";
import { format } from 'date-fns';

interface DocumentDetailsPaneProps {
  selectedDocument: DocumentInfo | null;
  documents: DocumentInfo[];
  currentUserEmail: string | null;
  roomDetails: RoomDetails;
  isFounder: boolean;
  isSigningDoc: string | null;
  isSigningModalOpen: boolean;
  onOpenAddSignerModal: (documentId: string) => void;
  onOpenSigningModal: (documentId: string) => void;
}

export default function DocumentDetailsPane({
  selectedDocument,
  documents,
  currentUserEmail,
//   roomDetails,
  isFounder,
  isSigningDoc,
  isSigningModalOpen,
  onOpenAddSignerModal,
  onOpenSigningModal
}: DocumentDetailsPaneProps) {
  if (!selectedDocument) {
    return (
      <div className="h-1/2">
        <h3 className="font-medium mb-2 text-sm">Document Details</h3>
        <div className="h-[calc(100%-2rem)] border rounded-lg overflow-auto bg-background p-3">
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Select a document to view details</p>
          </div>
        </div>
      </div>
    );
  }

  const isUploader = currentUserEmail === selectedDocument.uploaderEmail;
  const canManageSigners = isFounder || isUploader;

  return (
    <div className="h-1/2">
      <h3 className="font-medium mb-2 text-sm">Document Details</h3>
      <div className="h-[calc(100%-2rem)] border rounded-lg overflow-auto bg-background p-3">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">{selectedDocument.originalFilename}</h4>
            <span className="text-xs text-muted-foreground">
              {format(new Date(selectedDocument.uploadedAt), 'PP')}
            </span>
          </div>

          <div>
            <h5 className="text-xs font-medium mb-2 flex justify-between items-center">
              <span>Signatures</span>
              {canManageSigners && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2" 
                  onClick={() => onOpenAddSignerModal(selectedDocument.documentId)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              )}
            </h5>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left pb-2">Signer Email</th>
                  <th className="text-left pb-2">Required Role</th>
                  <th className="text-left pb-2">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents
                  .filter(doc => doc.documentId === selectedDocument.documentId)
                  .map((signerRecord, index) => {
                    const isCurrentUserSigner = currentUserEmail === signerRecord.emailToSign;
                    const hasSigned = signerRecord.signed === "true";
                    const signatureDisplay = signerRecord.signature
                      ? `${signerRecord.signature.slice(0, 10)}...`
                      : 'N/A';

                    return (
                      <tr key={`${signerRecord.emailToSign}-${index}`} className="text-xs">
                        <td className="py-2">{signerRecord.emailToSign} {isCurrentUserSigner ? '(You)' : ''}</td>
                        <td className="py-2">
                          <span className="capitalize">{signerRecord.roleToSign}</span>
                        </td>
                        <td className="py-2 font-mono">
                          {hasSigned ? (
                            <span>{signatureDisplay}</span>
                          ) : isCurrentUserSigner ? (
                            <Button
                              size="sm"
                              className="relative overflow-hidden rounded-full text-xs px-3 py-1 h-auto bg-blue-500 hover:bg-blue-600 text-white hover:text-white min-w-[80px]"
                              onClick={(e) => { e.stopPropagation(); onOpenSigningModal(selectedDocument.documentId); }}
                              disabled={isSigningDoc !== null}
                              title="E-Sign this document"
                            >
                              {isSigningDoc === selectedDocument.documentId && isSigningModalOpen ? (
                                <Loader2 className="h-4 w-4 animate-spin text-current" />
                              ) : (
                                'E-Sign'
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground italic">Not Yet Signed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Note: Learn more about our{" "}
              <a 
                href="/#/security" 
                className="text-blue-600 hover:text-blue-800 underline hover:no-underline font-medium not-italic"
                target="_blank"
                rel="noopener noreferrer"
              >
                security and encryption process
              </a>
              {" "}for document signing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 