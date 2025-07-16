import { useState, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import { FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { CustomLoader } from "../../components/ui/CustomLoader";
import type { DocumentInfo, RoomDetails, UploadDocumentResult } from "../../types/types";
import AllDocumentsPane from "./AllDocumentsPane";
import DocumentPreviewPane from "./DocumentPreviewPane";
import DocumentDetailsPane from "./DocumentDetailsPane";
import DocumentsPendingSignature from "./DocumentsPendingSignature";
import DocumentUploadModal from "./DocumentUploadModal";
import AddSignerModal from "./AddSignerModal";

interface DocumentsTabProps {
  // Room and document data
  roomDetails: RoomDetails;
  documents: DocumentInfo[];
  currentUserEmail: string | null;
  currentUserRole: string | null;
  isLoadingDetails: boolean;
  detailsError: string | null;
  
  // Document viewing/preview state
  selectedDocument: DocumentInfo | null;
  viewerDocuments: any[];
  isDecrypting: boolean;
  isViewingDoc: string | null;
  isDownloadingDoc: string | null;
  isPreparingView: boolean;
  
  // Upload state
  isUploadModalOpen: boolean;
  selectedFile: File | null;
  fileError: string | null;
  signers: string[];
  signerInput: string;
  isSignerSuggestionsOpen: boolean;
  preselectedCategory: string | null;
  uploadFormRef: React.RefObject<HTMLFormElement>;
  uploadState: UploadDocumentResult | null;
  
  // Signing state
  isSigningDoc: string | null;
  isSigningModalOpen: boolean;
  
  // Add signer state
  isAddSignerModalOpen: boolean;
  addSignerDocDetails: { documentId: string; currentSigners: string[] } | null;
  newSignerEmail: string;
  isSubmittingSigner: boolean;
  isAddSignerSuggestionsOpen: boolean;
  isRemovingSigner: string | null;
  
  // Actions
  onFetchRoomDetails: () => void;
  onViewDocument: (documentId: string) => void;
  onDownloadDocument: (documentId: string) => void;
  onOpenUploadModal: (category: string) => void;
  onOpenSigningModal: (documentId: string) => void;
  onOpenViewModal: (doc: DocumentInfo) => void;
  onExpandView: () => void;
  onOpenAddSignerModal: (documentId: string) => void;
  onAddSignerToDocument: () => void;
  onRemoveSignerFromDocument: (documentId: string, signerRecord: { emailToSign: string, signed: string }) => void;
  
  // State setters
  onSetIsUploadModalOpen: (open: boolean) => void;
  onSetSelectedFile: (file: File | null) => void;
  onSetFileError: (error: string | null) => void;
  onSetSigners: (signers: string[]) => void;
  onSetSignerInput: (input: string) => void;
  onSetIsSignerSuggestionsOpen: (open: boolean) => void;
  onSetPreselectedCategory: (category: string | null) => void;
  onSetIsAddSignerModalOpen: (open: boolean) => void;
  onSetNewSignerEmail: (email: string) => void;
  onSetIsAddSignerSuggestionsOpen: (open: boolean) => void;
  onSetAddSignerDocDetails: (details: { documentId: string; currentSigners: string[] } | null) => void;
  
  // Form actions
  uploadFormAction: (formData: FormData) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSigner: (email?: string) => void;
  onRemoveSigner: (email: string) => void;
}

export default function DocumentsTab({
  roomDetails,
  documents,
  currentUserEmail,
  currentUserRole,
  isLoadingDetails,
  detailsError,
  selectedDocument,
  viewerDocuments,
  isDecrypting,
  isViewingDoc,
  isDownloadingDoc,
  isPreparingView,
  isUploadModalOpen,
  selectedFile,
  fileError,
  signers,
  signerInput,
  isSignerSuggestionsOpen,
  preselectedCategory,
  uploadFormRef,
  uploadState,
  isSigningDoc,
  isSigningModalOpen,
  isAddSignerModalOpen,
  addSignerDocDetails,
  newSignerEmail,
  isSubmittingSigner,
  isAddSignerSuggestionsOpen,
  isRemovingSigner,
  onFetchRoomDetails,
  onViewDocument,
  onDownloadDocument,
  onOpenUploadModal,
  onOpenSigningModal,
  onOpenViewModal,
  onExpandView,
  onOpenAddSignerModal,
  onAddSignerToDocument,
  onRemoveSignerFromDocument,
  onSetIsUploadModalOpen,
  onSetSelectedFile,
  onSetFileError,
  onSetSigners,
  onSetSignerInput,
  onSetIsSignerSuggestionsOpen,
  onSetPreselectedCategory,
  onSetIsAddSignerModalOpen,
  onSetNewSignerEmail,
  onSetIsAddSignerSuggestionsOpen,
  onSetAddSignerDocDetails,
  uploadFormAction,
  onFileChange,
  onAddSigner,
  onRemoveSigner
}: DocumentsTabProps) {
  
  // Derived state
  const roomPublicKey = roomDetails?.roomPubKey;
  const currentUserRoleDetails = roomDetails?.roomRoles.find(r => r.roleName === currentUserRole);
  const allowedUploadCategories = currentUserRoleDetails ? currentUserRoleDetails.documentTypes : [];
  const isFounder = currentUserRole === 'founder';

  const handleUploadModalChange = (isOpen: boolean) => {
    onSetIsUploadModalOpen(isOpen);
    if (!isOpen) {
      onSetPreselectedCategory(null);
      onSetSelectedFile(null);
      onSetFileError(null);
      onSetSigners([]);
      onSetSignerInput("");
      if (uploadFormRef.current) uploadFormRef.current.reset();
    }
  };

  const handleAddSignerModalClose = () => {
    onSetNewSignerEmail("");
    onSetAddSignerDocDetails(null);
    onSetIsAddSignerSuggestionsOpen(false);
  };

  if (isLoadingDetails) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <CustomLoader text="Loading documents..." />
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-destructive p-4 border rounded-md bg-card">
        <AlertTriangle className="h-8 w-8 mb-4" />
        <p className="mb-2">Could not load room data:</p>
        <p className="text-sm mb-4">{detailsError}</p>
        <Button onClick={onFetchRoomDetails} variant="destructive" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-10 border rounded-md bg-card text-center">
        <FileText className="h-20 w-20 text-muted-foreground/20 mb-6" />
        <p className="text-xl font-medium text-muted-foreground mb-4">No documents found.</p>
        <p className="text-base text-muted-foreground mb-2 max-w-lg">
          Upload your first document to get started.
        </p>
        <p className="text-sm text-muted-foreground mb-8 max-w-lg">
          All files are securely stored and encrypted.
        </p>
        <Button size="lg" onClick={() => onSetPreselectedCategory(null)} disabled={!roomPublicKey}>
          <FileText className="mr-2 h-5 w-5" /> Upload First Document
        </Button>
        
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onOpenChange={handleUploadModalChange}
          roomId={roomDetails.roomId}
          currentUserEmail={currentUserEmail}
          currentUserRole={currentUserRole}
          roomPublicKey={roomPublicKey}
          allowedUploadCategories={allowedUploadCategories}
          roomDetails={roomDetails}
          preselectedCategory={preselectedCategory}
          selectedFile={selectedFile}
          fileError={fileError}
          signers={signers}
          signerInput={signerInput}
          isSignerSuggestionsOpen={isSignerSuggestionsOpen}
          uploadFormRef={uploadFormRef}
          uploadFormAction={uploadFormAction}
          uploadState={uploadState}
          onFileChange={onFileChange}
          onAddSigner={onAddSigner}
          onRemoveSigner={onRemoveSigner}
          onSetSignerInput={onSetSignerInput}
          onSetIsSignerSuggestionsOpen={onSetIsSignerSuggestionsOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] space-x-4">
      <div className="w-1/2 overflow-auto border rounded-md bg-card">
        <div className="flex h-full">
          <AllDocumentsPane
            roomDetails={roomDetails}
            documents={documents}
            allowedUploadCategories={allowedUploadCategories}
            isViewingDoc={isViewingDoc}
            isDownloadingDoc={isDownloadingDoc}
            onViewDocument={onViewDocument}
            onDownloadDocument={onDownloadDocument}
            onOpenUploadModal={onOpenUploadModal}
          />

          <div className="w-1/2 overflow-auto border rounded-md bg-card p-3 flex flex-col">
            <DocumentPreviewPane
              selectedDocument={selectedDocument}
              viewerDocuments={viewerDocuments}
              isDecrypting={isDecrypting}
              isPreparingView={isPreparingView}
              onExpandView={onExpandView}
            />

            <DocumentDetailsPane
              selectedDocument={selectedDocument}
              documents={documents}
              currentUserEmail={currentUserEmail}
              roomDetails={roomDetails}
              isFounder={isFounder}
              isSigningDoc={isSigningDoc}
              isSigningModalOpen={isSigningModalOpen}
              onOpenAddSignerModal={onOpenAddSignerModal}
              onOpenSigningModal={onOpenSigningModal}
            />
          </div>
        </div>
      </div>

      <DocumentsPendingSignature
        documents={documents}
        currentUserEmail={currentUserEmail}
        roomDetails={roomDetails}
        isPreparingView={isPreparingView}
        isDownloadingDoc={isDownloadingDoc}
        isViewingDoc={isViewingDoc}
        isSigningDoc={isSigningDoc}
        isSigningModalOpen={isSigningModalOpen}
        isRemovingSigner={isRemovingSigner}
        isUploadModalOpen={isUploadModalOpen}
        selectedFile={selectedFile}
        fileError={fileError}
        signers={signers}
        signerInput={signerInput}
        isSignerSuggestionsOpen={isSignerSuggestionsOpen}
        allowedUploadCategories={allowedUploadCategories}
        roomPublicKey={roomPublicKey}
        uploadFormRef={uploadFormRef}
        uploadFormAction={uploadFormAction}
        onOpenViewModal={onOpenViewModal}
        onDownloadDocument={onDownloadDocument}
        onOpenSigningModal={onOpenSigningModal}
        onOpenAddSignerModal={onOpenAddSignerModal}
        onRemoveSignerFromDocument={onRemoveSignerFromDocument}
        onSetIsUploadModalOpen={handleUploadModalChange}
        onFileChange={onFileChange}
        onAddSigner={onAddSigner}
        onRemoveSigner={onRemoveSigner}
        onSetSignerInput={onSetSignerInput}
        onSetIsSignerSuggestionsOpen={onSetIsSignerSuggestionsOpen}
        uploadState={uploadState}
      />

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onOpenChange={handleUploadModalChange}
        roomId={roomDetails.roomId}
        currentUserEmail={currentUserEmail}
        currentUserRole={currentUserRole}
        roomPublicKey={roomPublicKey}
        allowedUploadCategories={allowedUploadCategories}
        roomDetails={roomDetails}
        preselectedCategory={preselectedCategory}
        selectedFile={selectedFile}
        fileError={fileError}
        signers={signers}
        signerInput={signerInput}
        isSignerSuggestionsOpen={isSignerSuggestionsOpen}
        uploadFormRef={uploadFormRef}
        uploadFormAction={uploadFormAction}
        uploadState={uploadState}
        onFileChange={onFileChange}
        onAddSigner={onAddSigner}
        onRemoveSigner={onRemoveSigner}
        onSetSignerInput={onSetSignerInput}
        onSetIsSignerSuggestionsOpen={onSetIsSignerSuggestionsOpen}
      />

      <AddSignerModal
        isOpen={isAddSignerModalOpen}
        onOpenChange={onSetIsAddSignerModalOpen}
        roomDetails={roomDetails}
        addSignerDocDetails={addSignerDocDetails}
        newSignerEmail={newSignerEmail}
        isSubmittingSigner={isSubmittingSigner}
        isAddSignerSuggestionsOpen={isAddSignerSuggestionsOpen}
        onSetNewSignerEmail={onSetNewSignerEmail}
        onSetIsAddSignerSuggestionsOpen={onSetIsAddSignerSuggestionsOpen}
        onAddSignerToDocument={onAddSignerToDocument}
        onClose={handleAddSignerModalClose}
      />
    </div>
  );
} 