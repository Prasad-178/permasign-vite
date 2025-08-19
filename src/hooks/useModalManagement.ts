import { useState, useCallback } from "react";
import { toast } from "sonner";
import { type DocumentInfo } from '../types/types';

interface UseModalManagementProps {
  documents: DocumentInfo[];
  getDecryptedRoomKey: () => Promise<string | null>;
  retrieveAndDecrypt: (document: DocumentInfo, decryptedKey: string) => Promise<any>;
  retrieveAndDecryptWithStitching: (document: DocumentInfo, decryptedKey: string) => Promise<any>;
}

export function useModalManagement({
  documents,
  getDecryptedRoomKey,
  retrieveAndDecrypt,
  retrieveAndDecryptWithStitching
}: UseModalManagementProps) {
  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);

  // Signing modal state
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signingDocumentId, setSigningDocumentId] = useState<string | null>(null);
  const [signingDocumentData, setSigningDocumentData] = useState<string | null>(null);
  const [signingDocumentName, setSigningDocumentName] = useState<string>("");
  const [signingDocumentType, setSigningDocumentType] = useState<string>("");

  // View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalDocData, setViewModalDocData] = useState<string | null>(null);
  const [viewModalDocument, setViewModalDocument] = useState<DocumentInfo | null>(null);
  const [isPreparingView, setIsPreparingView] = useState(false);

  // Upload modal management
  const handleOpenUploadModal = useCallback((category: string) => {
    setPreselectedCategory(category);
    setIsUploadModalOpen(true);
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    setFileError(null);
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError("File is too large (max 100MB).");
        setSelectedFile(null);
        event.target.value = "";
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  }, []);

  // Signing modal management
  const openSigningModal = useCallback(async (documentId: string) => {
    const docToSign = documents.find(doc => doc.documentId === documentId);
    if (!docToSign) {
      toast.error("Document not found");
      return;
    }

    setSigningDocumentId(documentId);
    setSigningDocumentName(docToSign.originalFilename);
    setSigningDocumentType(docToSign.contentType);
    setIsSigningModalOpen(true);

    setSigningDocumentData(null);
    try {
      const decryptedKey = await getDecryptedRoomKey();
      if (!decryptedKey) {
        throw new Error("Failed to obtain decrypted room key for preview.");
      }

      console.log(`Calling retrieveAndDecrypt for signing modal preview: ${documentId}`);
      const result = await retrieveAndDecryptWithStitching(docToSign, decryptedKey);

      if (result.success && result.data) {
        setSigningDocumentData(result.data.decryptedData);
      } else {
        toast.error(`Failed to load document preview: ${result.error || result.message}`);
        setSigningDocumentData(null);
      }
    } catch (error: any) {
      console.error("Error loading document for signing:", error);
      // Avoid showing duplicate toast if getDecryptedRoomKey already showed one
      if (error.message && !error.message.includes("decrypted room key") && !error.message.includes("obtain decrypted room key")) {
        toast.error(`Error loading document preview: ${error.message || "Unknown error"}`);
      }
      setSigningDocumentData(null);
    }
  }, [documents, getDecryptedRoomKey, retrieveAndDecrypt]);

  const closeSigningModal = useCallback(() => {
    setIsSigningModalOpen(false);
    setSigningDocumentId(null);
    setSigningDocumentData(null);
  }, []);

  // View modal management
  const handleOpenViewModal = useCallback(async (docToView: DocumentInfo) => {
    if (!docToView) {
      toast.error("Document details are missing.");
      return;
    }

    setIsPreparingView(true);
    setIsViewModalOpen(true);
    setViewModalDocData(null); // Clear previous data
    setViewModalDocument(docToView); // Store the document being viewed

    try {
      const decryptedKey = await getDecryptedRoomKey();
      if (!decryptedKey) {
        throw new Error("Failed to obtain decrypted room key for preview.");
      }

      const result = await retrieveAndDecryptWithStitching(docToView, decryptedKey);

      if (result.success && result.data) {
        setViewModalDocData(result.data.decryptedData);
      } else {
        toast.error(`Failed to load document for expanded view: ${result.error || result.message}`);
        setIsViewModalOpen(false); // Close modal on error
      }
    } catch (error: any) {
      console.error("Error opening view modal:", error);
      if (error.message && !error.message.includes("decrypted room key")) {
        toast.error(`Error loading document preview: ${error.message || "Unknown error"}`);
      }
      setIsViewModalOpen(false); // Close modal on error
    } finally {
      setIsPreparingView(false);
    }
  }, [getDecryptedRoomKey, retrieveAndDecrypt]);

  const closeViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewModalDocData(null);
    setViewModalDocument(null);
  }, []);

  return {
    // Upload modal state
    isUploadModalOpen,
    setIsUploadModalOpen,
    selectedFile,
    setSelectedFile,
    fileError,
    setFileError,
    preselectedCategory,
    setPreselectedCategory,

    // Signing modal state
    isSigningModalOpen,
    signingDocumentId,
    signingDocumentData,
    signingDocumentName,
    signingDocumentType,

    // View modal state
    isViewModalOpen,
    viewModalDocData,
    viewModalDocument,
    isPreparingView,

    // Actions
    handleOpenUploadModal,
    handleFileChange,
    openSigningModal,
    closeSigningModal,
    handleOpenViewModal,
    closeViewModal
  };
} 