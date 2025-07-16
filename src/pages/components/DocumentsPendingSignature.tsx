import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../../components/ui/dialog";
import { UploadCloud, Sparkles, Eye, Download, Loader2, UserPlus, X } from "lucide-react";
import type { DocumentInfo, RoomDetails } from "../../types/types";
import { format } from 'date-fns';

interface DocumentsPendingSignatureProps {
  documents: DocumentInfo[];
  currentUserEmail: string | null;
  roomDetails: RoomDetails;
  isPreparingView: boolean;
  isDownloadingDoc: string | null;
  isViewingDoc: string | null;
  isSigningDoc: string | null;
  isSigningModalOpen: boolean;
  isRemovingSigner: string | null;
  isUploadModalOpen: boolean;
  selectedFile: File | null;
  fileError: string | null;
  signers: string[];
  signerInput: string;
  isSignerSuggestionsOpen: boolean;
  allowedUploadCategories: string[];
  roomPublicKey: string | undefined;
  uploadFormRef: React.RefObject<HTMLFormElement>;
  uploadFormAction: (formData: FormData) => void;
  onOpenViewModal: (doc: DocumentInfo) => void;
  onDownloadDocument: (documentId: string) => void;
  onOpenSigningModal: (documentId: string) => void;
  onOpenAddSignerModal: (documentId: string) => void;
  onRemoveSignerFromDocument: (documentId: string, signerRecord: { emailToSign: string, signed: string }) => void;
  onSetIsUploadModalOpen: (open: boolean) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSigner: (email?: string) => void;
  onRemoveSigner: (email: string) => void;
  onSetSignerInput: (input: string) => void;
  onSetIsSignerSuggestionsOpen: (open: boolean) => void;
  uploadState: any;
}

export default function DocumentsPendingSignature({
  documents,
  currentUserEmail,
  roomDetails,
  isPreparingView,
  isDownloadingDoc,
  isViewingDoc,
  isSigningDoc,
  isSigningModalOpen,
  isRemovingSigner,
  isUploadModalOpen,
  selectedFile,
  fileError,
  signers,
  signerInput,
  isSignerSuggestionsOpen,
  allowedUploadCategories,
  roomPublicKey,
  uploadFormRef,
  uploadFormAction,
  onOpenViewModal,
  onDownloadDocument,
  onOpenSigningModal,
  onOpenAddSignerModal,
  onRemoveSignerFromDocument,
  onSetIsUploadModalOpen,
  onFileChange,
  onAddSigner,
  onRemoveSigner,
  onSetSignerInput,
  onSetIsSignerSuggestionsOpen,
  uploadState
}: DocumentsPendingSignatureProps) {
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Group documents by ID
  const documentGroups = new Map<string, {
    document: DocumentInfo,
    signers: Array<{ email: string, role: string, signed: string }>
  }>();

  documents.forEach(doc => {
    const email = doc.emailToSign;
    const role = doc.roleToSign;
    const signed = doc.signed || "false";

    if (!email || !role) {
      console.warn(`Skipping document record for docId ${doc.documentId} due to missing emailToSign or roleToSign`);
      return;
    }

    if (!documentGroups.has(doc.documentId)) {
      documentGroups.set(doc.documentId, {
        document: doc,
        signers: [{ email, role, signed }]
      });
    } else {
      const existingSigners = documentGroups.get(doc.documentId)?.signers;
      if (!existingSigners?.some(s => s.email === email && s.role === role)) {
        existingSigners?.push({ email, role, signed });
      }
    }
  });

  const pendingSignatureDocs = Array.from(documentGroups.values()).filter(({ signers }) => {
    const allSigned = signers.every(signer => signer.signed === "true");
    return !allSigned;
  });

  const isFounder = roomDetails?.members.find(m => m.userEmail === currentUserEmail)?.role === 'founder';

  return (
    <div className="w-1/2 overflow-auto border rounded-md bg-card p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">Documents Pending Signature</h3>
        <Dialog
          open={isUploadModalOpen}
          onOpenChange={onSetIsUploadModalOpen}
        >
          <DialogTrigger asChild>
            <Button size="sm" disabled={!roomPublicKey}>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            {/* Upload modal content would go here - keeping it simple for now */}
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                Select an agreement to upload to the company's shared space.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Upload modal content...</p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {(() => {
          if (pendingSignatureDocs.length === 0 && documents.length > 0) {
            return (
              <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed rounded-lg p-6 text-muted-foreground">
                <Sparkles className="h-10 w-10 mb-3 text-green-500" />
                <p className="font-medium">All documents have been signed!</p>
                <p className="text-sm">No pending signatures required.</p>
              </div>
            );
          } else if (pendingSignatureDocs.length === 0 && documents.length === 0) {
            return null;
          }

          return pendingSignatureDocs.map(({ document: doc, signers }) => {
            const categoryInfo = doc.category;
            const overallStatusColor = "bg-yellow-500";
            const overallStatusText = "Pending";

            const isUploader = currentUserEmail === doc.uploaderEmail;
            const canManageSigners = isFounder || isUploader;

            return (
              <div key={doc.documentId} className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium flex items-center text-lg capitalize">
                      <div className={`w-3 h-3 rounded-full ${overallStatusColor} mr-2`} title={overallStatusText} />
                      {categoryInfo?.replace(/_/g, ' ') || doc.category}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{doc.originalFilename}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={(e) => { e.stopPropagation(); onOpenViewModal(doc); }}
                      disabled={isPreparingView}
                      className="flex items-center cursor-pointer"
                    >
                      {isPreparingView ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />} View
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={(e) => { e.stopPropagation(); onDownloadDocument(doc.documentId); }}
                      disabled={!!isViewingDoc || !!isDownloadingDoc}
                      className="flex items-center cursor-pointer"
                    >
                      {isDownloadingDoc === doc.documentId ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />} Download
                    </Button>
                  </div>
                </div>

                <div className="mt-4 border rounded-md overflow-hidden">
                  <div className="bg-muted/30 p-3 flex justify-between items-center">
                    <h5 className="font-medium text-sm">Signers</h5>
                    <div className="flex items-center gap-2">
                      {canManageSigners && (
                        <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => onOpenAddSignerModal(doc.documentId)}>
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add Signer
                        </Button>
                      )}
                      <div className="flex items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${overallStatusColor} mr-2`} />
                        <span className="text-sm">{overallStatusText}</span>
                      </div>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-muted/20 text-xs font-medium text-muted-foreground">
                      <tr>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Role</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {signers.map((signer, index) => {
                        const isSigned = signer.signed === "true";
                        const statusColor = isSigned ? "bg-green-500" : "bg-yellow-500";
                        const statusText = isSigned ? "Signed" : "Pending";
                        const isCurrentUserSigner = currentUserEmail === signer.email;

                        const canRemove = canManageSigners && !isSigned && signer.email !== roomDetails?.ownerEmail;
                        const removalKey = `${doc.documentId}-${signer.email}`;

                        return (
                          <tr key={`${signer.email}-${index}`} className="hover:bg-muted/10">
                            <td className="p-2 text-sm">
                              {signer.email}
                              {isCurrentUserSigner && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                            </td>
                            <td className="p-2">
                              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{signer.role}</span>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full ${statusColor} mr-2`} />
                                <span className="text-sm">{statusText}</span>
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              {!isSigned && isCurrentUserSigner && (
                                <Button
                                  size="sm"
                                  className="relative overflow-hidden rounded-full text-xs px-3 py-1 h-auto bg-blue-500 hover:bg-blue-600 text-white hover:text-white min-w-[80px]"
                                  onClick={(e) => { e.stopPropagation(); onOpenSigningModal(doc.documentId); }}
                                  disabled={isSigningDoc !== null}
                                >
                                  {isSigningDoc === doc.documentId && isSigningModalOpen ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-current" />
                                  ) : (
                                    'E-Sign'
                                  )}
                                </Button>
                              )}
                              {canRemove && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  title="Remove Signer" 
                                  onClick={() => onRemoveSignerFromDocument(doc.documentId, { emailToSign: signer.email, signed: signer.signed })} 
                                  disabled={isRemovingSigner === removalKey}
                                >
                                  {isRemovingSigner === removalKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground mt-3">
                  <span>Uploaded by: {doc.uploaderEmail}</span>
                  <span>Size: {formatFileSize(doc.fileSize)}</span>
                  <span>Date: {format(new Date(doc.uploadedAt), 'PP')}</span>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
} 