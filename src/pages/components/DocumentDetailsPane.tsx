import { Button } from "../../components/ui/button";
import { UserPlus, Loader2, Shield, CheckCircle, Clock } from "lucide-react";
import { type DocumentInfo, type RoomDetails } from "../../types/types";
import { format } from 'date-fns';
import { Badge } from "../../components/ui/badge";

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
      <div className="h-[65%]">
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
  
  // Get signature records for this document
  const signatureRecords = documents.filter(doc => doc.documentId === selectedDocument.documentId);
  const completedSignatures = signatureRecords.filter(doc => doc.signed === "true");
  // const pendingSignatures = signatureRecords.filter(doc => doc.signed === "false");

  return (
    <div className="h-[65%]">
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
            <h5 className="text-xs font-medium mb-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Digital Signatures</span>
                <Badge variant="outline" className="text-xs">
                  {completedSignatures.length}/{signatureRecords.length} Complete
                </Badge>
              </div>
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
            
            <div className="space-y-2">
              {signatureRecords.map((signerRecord, index) => {
                const isCurrentUserSigner = currentUserEmail === signerRecord.emailToSign;
                const hasSigned = signerRecord.signed === "true";

                return (
                  <div key={`${selectedDocument.documentId}-${signerRecord.emailToSign}-${signerRecord.roleToSign}`} className="border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {signerRecord.emailToSign}
                            {isCurrentUserSigner && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                          </p>
                          <Badge variant={hasSigned ? "default" : "secondary"} className="text-xs">
                            {hasSigned ? (
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
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          Role: {signerRecord.roleToSign?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      
                      {!hasSigned && isCurrentUserSigner && (
                        <Button
                          size="sm"
                          className="ml-2 h-7 px-3 text-xs bg-blue-500 hover:bg-blue-600"
                          onClick={(e) => { e.stopPropagation(); onOpenSigningModal(selectedDocument.documentId); }}
                          disabled={isSigningDoc !== null}
                          title="E-Sign this document"
                        >
                          {isSigningDoc === selectedDocument.documentId && isSigningModalOpen ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'E-Sign'
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {hasSigned && (
                      <div className="space-y-2 pt-2 border-t border-muted">
                        {signerRecord.signedAt && (
                          <div>
                            <span className="text-xs text-muted-foreground">Signed Date:</span>
                            <p className="text-xs font-medium">
                              {new Date(signerRecord.signedAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZoneName: 'short'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {signatureRecords.length === 0 && (
              <div className="text-center py-4 border-2 border-dashed rounded-lg">
                <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No signatures required for this document</p>
                <p className="text-xs text-muted-foreground">Use the "Add" button above to add signers</p>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-medium text-blue-800">Security & Verification</p>
                  <p className="text-blue-700">
                    • All signatures are cryptographically secured using SHA-256 hashing
                  </p>
                  <p className="text-blue-700">
                    • Signature data is immutably stored on Arweave blockchain
                  </p>
                  <p className="text-blue-700">
                    • <strong>Digital signatures are appended to the end of downloaded documents</strong> for verification
                  </p>
                  <p className="text-blue-700">
                    • Learn more about our{" "}
                    <a 
                      href="/#/security" 
                      className="text-blue-600 hover:text-blue-800 underline hover:no-underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      security and encryption process
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 