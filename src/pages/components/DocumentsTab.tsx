import { Button } from "../../components/ui/button";
import { FileText, AlertTriangle, RefreshCw, Upload } from "lucide-react";
import { CustomLoader } from "../../components/ui/CustomLoader";
import type { DocumentInfo, RoomDetails, UploadDocumentResult } from "../../types/types";
import AllDocumentsPane from "./AllDocumentsPane";
import DocumentPreviewPane from "./DocumentPreviewPane";
import DocumentDetailsPane from "./DocumentDetailsPane";
import DocumentsPendingSignature from "./DocumentsPendingSignature";
import DocumentUploadModal from "./DocumentUploadModal";
import { useCallback, useState, useRef, useEffect } from "react";


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
  categoryInput: string;
  isCategorySuggestionsOpen: boolean;
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
  isRemovingSigner: string | null;
  
  // State management
  stateUpdater: any;
  
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
  onSetCategoryInput: (input: string) => void;
  onSetIsCategorySuggestionsOpen: (open: boolean) => void;
  onSetPreselectedCategory: (category: string | null) => void;
  onSetIsAddSignerModalOpen: (open: boolean) => void;
  onSetNewSignerEmail: (email: string) => void;
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
  categoryInput,
  isCategorySuggestionsOpen,
  preselectedCategory,
  uploadFormRef,
  uploadState,
  isSigningDoc,
  isSigningModalOpen,
  isRemovingSigner,
  stateUpdater,
  onFetchRoomDetails,
  onViewDocument,
  onDownloadDocument,
  onOpenUploadModal,
  onOpenSigningModal,
  onOpenViewModal,
  onExpandView,
  onOpenAddSignerModal,
  onRemoveSignerFromDocument,
  onSetIsUploadModalOpen,
  onSetSelectedFile,
  onSetFileError,
  onSetSigners,
  onSetSignerInput,
  onSetIsSignerSuggestionsOpen,
  onSetCategoryInput,
  onSetIsCategorySuggestionsOpen,
  onSetPreselectedCategory,
  uploadFormAction,
  onFileChange,
  onAddSigner,
  onRemoveSigner
}: DocumentsTabProps) {
  
  const [isDragOver, setIsDragOver] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
      onSetCategoryInput("");
      onSetIsCategorySuggestionsOpen(false);
      if (uploadFormRef.current) uploadFormRef.current.reset();
    }
  };

  const handleUploadFirstDocument = () => {
    onSetPreselectedCategory(null);
    onSetCategoryInput("");
    onSetIsUploadModalOpen(true);
  };

  // Optimized drag and drop handlers with debouncing and better performance
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    // Only set drag over if not already set (prevent unnecessary re-renders)
    if (!isDragOver) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle drag leave for the main container to prevent flickering
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Check if the mouse is actually outside the container
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      // Use a small timeout to prevent flickering when dragging over child elements
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragOver(false);
      }, 50);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any pending timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      
      // Basic file validation before processing
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        onSetFileError("File is too large (max 100MB).");
        return;
      }
      
      // Set the file and clear any previous states
      onSetSelectedFile(file);
      onSetFileError(null);
      onSetPreselectedCategory(null);
      
      // Ensure category input is cleared for user to enter
      onSetCategoryInput("");
      
      // Initialize signers if not already set
      if (signers.length === 0 && roomDetails?.ownerEmail) {
        onSetSigners([roomDetails.ownerEmail]);
      }
      
      // Open the modal
      onSetIsUploadModalOpen(true);
    }
  }, [onSetSelectedFile, onSetFileError, onSetPreselectedCategory, onSetIsUploadModalOpen, onSetCategoryInput, signers.length, roomDetails?.ownerEmail, onSetSigners]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

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
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="h-[calc(100vh-220px)] flex flex-col overflow-hidden">
        <div 
          className={`flex-1 flex flex-col items-center justify-center border-2 rounded-md bg-card text-center transition-all duration-200 mb-4 ${
            isDragOver 
              ? 'border-primary border-dashed bg-primary/5' 
              : 'border-dashed border-muted-foreground/20'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="max-w-lg px-8">
            {isDragOver ? (
              <>
                <Upload className="h-20 w-20 text-primary mb-6 mx-auto" />
                <p className="text-xl font-medium text-primary mb-4">Drop your document here</p>
                <p className="text-base text-muted-foreground mb-4">
                  Release to upload your first document
                </p>
              </>
            ) : (
              <>
                <FileText className="h-20 w-20 text-muted-foreground/20 mb-6 mx-auto" />
                <p className="text-xl font-medium text-muted-foreground mb-4">No documents found.</p>
                <p className="text-base text-muted-foreground mb-2">
                  Upload your first document to get started.
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  All files are securely stored and encrypted.
                </p>
                <p className="text-xs text-muted-foreground/70 mb-8">
                  💡 You can also drag and drop files directly onto this area
                </p>
                <Button size="lg" onClick={handleUploadFirstDocument} disabled={!roomPublicKey}>
                  <FileText className="mr-2 h-5 w-5" /> Upload First Document
                </Button>
              </>
            )}
          </div>
        </div>
        
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
          categoryInput={categoryInput}
          isCategorySuggestionsOpen={isCategorySuggestionsOpen}
          uploadFormRef={uploadFormRef}
          uploadFormAction={uploadFormAction}
          uploadState={uploadState}
          onFileChange={onFileChange}
          onAddSigner={onAddSigner}
          onRemoveSigner={onRemoveSigner}
          onSetSignerInput={onSetSignerInput}
          onSetIsSignerSuggestionsOpen={onSetIsSignerSuggestionsOpen}
          onSetCategoryInput={onSetCategoryInput}
          onSetIsCategorySuggestionsOpen={onSetIsCategorySuggestionsOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-220px)] space-x-4">
      <div className="w-1/2 border rounded-md bg-card">
        <div className="flex h-full">
          <AllDocumentsPane
            roomDetails={roomDetails}
            documents={documents}
            allowedUploadCategories={allowedUploadCategories}
            isViewingDoc={isViewingDoc}
            isDownloadingDoc={isDownloadingDoc}
            currentUserEmail={currentUserEmail}
            currentUserRole={currentUserRole}
            stateUpdater={stateUpdater}
            onViewDocument={onViewDocument}
            onDownloadDocument={onDownloadDocument}
            onOpenUploadModal={onOpenUploadModal}
          />

          <div className="w-1/2 border rounded-md bg-card p-3 flex flex-col">
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
        categoryInput={categoryInput}
        isCategorySuggestionsOpen={isCategorySuggestionsOpen}
        uploadFormRef={uploadFormRef}
        uploadFormAction={uploadFormAction}
        uploadState={uploadState}
        onFileChange={onFileChange}
        onAddSigner={onAddSigner}
        onRemoveSigner={onRemoveSigner}
        onSetSignerInput={onSetSignerInput}
        onSetIsSignerSuggestionsOpen={onSetIsSignerSuggestionsOpen}
        onSetCategoryInput={onSetCategoryInput}
        onSetIsCategorySuggestionsOpen={onSetIsCategorySuggestionsOpen}
      />


    </div>
  );
} 