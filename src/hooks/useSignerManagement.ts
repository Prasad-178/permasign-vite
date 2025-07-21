import { useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  addSignerToDocumentClientAction,
  removeSignerFromDocumentClientAction
} from '../services/roomActionsClient';
import { getDocumentCache } from "../utils/documentCache";
import {
  type AddSignerToDocumentInput,
  type RemoveSignerFromDocumentInput,
  type ModifySignerResult,
  type DocumentInfo,
  companyName
} from '../types/types';

interface UseSignerManagementProps {
  roomId: string;
  currentUserEmail: string | null;
  currentUserRole?: string | null;
  roomDetails: any;
  documents: DocumentInfo[];
  stateUpdater: any;
}

export function useSignerManagement({
  roomId,
  currentUserEmail,
  currentUserRole,
  roomDetails,
  documents,
  stateUpdater
}: UseSignerManagementProps) {
  const documentCache = getDocumentCache();
  
  // Upload modal signer state
  const [signers, setSigners] = useState<string[]>([]);
  const [signerInput, setSignerInput] = useState("");
  const [isSignerSuggestionsOpen, setIsSignerSuggestionsOpen] = useState(false);
  
  // Add signer modal state
  const [isAddSignerModalOpen, setIsAddSignerModalOpen] = useState(false);
  const [addSignerDocDetails, setAddSignerDocDetails] = useState<{ documentId: string; currentSigners: string[] } | null>(null);
  const [newSignerEmail, setNewSignerEmail] = useState("");
  const [isSubmittingSigner, setIsSubmittingSigner] = useState(false);
  const [isRemovingSigner, setIsRemovingSigner] = useState<string | null>(null);

  // Upload modal signer management
  const handleAddSigner = useCallback((email?: string) => {
    const emailToAdd = (email || signerInput).trim();
    if (emailToAdd) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToAdd)) {
        toast.error("Invalid email format.");
        return;
      }
      if (signers.includes(emailToAdd)) {
        toast.warning("Signer already added.");
      } else {
        setSigners([...signers, emailToAdd]);
      }
      setSignerInput("");
      setIsSignerSuggestionsOpen(false);
    }
  }, [signerInput, signers]);

  const handleRemoveSigner = useCallback((emailToRemove: string) => {
    if (emailToRemove === roomDetails?.ownerEmail) {
      toast.error("The room owner cannot be removed as a signer.");
      return;
    }
    setSigners(signers.filter(signer => signer !== emailToRemove));
  }, [signers, roomDetails?.ownerEmail]);

  // Add signer modal management
  const handleOpenAddSignerModal = useCallback((documentId: string) => {
    const currentSigners = documents
      .filter(d => d.documentId === documentId)
      .map(d => d.emailToSign);
    setAddSignerDocDetails({ documentId, currentSigners: currentSigners as string[] });
    setIsAddSignerModalOpen(true);
  }, [documents]);

  const handleAddSignerToDocument = useCallback(async () => {
    if (!addSignerDocDetails || !newSignerEmail || !currentUserEmail) {
      toast.error("Invalid state for adding signer.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSignerEmail)) {
      toast.error("Invalid email format.");
      return;
    }

    if (addSignerDocDetails.currentSigners.includes(newSignerEmail)) {
      toast.warning("This email is already a signer for this document.");
      return;
    }

    setIsSubmittingSigner(true);
    const toastId = toast.loading("Adding signer...");
    const document = documents.find(doc => doc.documentId === addSignerDocDetails.documentId);

    const input: AddSignerToDocumentInput = {
      roomId,
      documentId: addSignerDocDetails.documentId,
      callerEmail: currentUserEmail,
      signerEmail: newSignerEmail,
      roomName: roomDetails.roomName,
      companyName,
      documentName: document?.originalFilename || 'a document',
    };

    try {
      const result: ModifySignerResult = await addSignerToDocumentClientAction(input);
      if (result.success) {
        toast.success("Signer Added", { id: toastId, description: result.message });
        setIsAddSignerModalOpen(false);
        setNewSignerEmail("");
        // Add signer to state instead of full reload
        if (addSignerDocDetails) {
          const existingMember = roomDetails.members.find((m: any) => m.userEmail === newSignerEmail);
          const roleForSigner = existingMember ? existingMember.role : 'member';
          stateUpdater.addSignerToDocument(addSignerDocDetails.documentId, newSignerEmail, roleForSigner);
          // If the new signer is not already a member, add them to the room members list
          if (!existingMember) {
            stateUpdater.addMember({ userEmail: newSignerEmail, role: "member" });
          }
          // Add log entry for the activity
          const documentName = document?.originalFilename || 'a document';
          stateUpdater.addLog(currentUserEmail!, `Added ${newSignerEmail} as a signer for document '${documentName}'.`);
          // Invalidate cache since document signer list has changed
          documentCache.invalidate(addSignerDocDetails.documentId);
          console.log(`[DocumentCache] Invalidated cache for document ${addSignerDocDetails.documentId} after adding signer`);
        }
        setAddSignerDocDetails(null);
      } else {
        throw new Error(result.error || result.message || "Failed to add signer.");
      }
    } catch (error: any) {
      toast.error("Error", { id: toastId, description: error.message });
    } finally {
      setIsSubmittingSigner(false);
    }
  }, [addSignerDocDetails, newSignerEmail, currentUserEmail, roomId, currentUserRole, documentCache, documents]);

  const handleRemoveSignerFromDocument = useCallback(async (documentId: string, signerRecord: { emailToSign: string, signed: string }) => {
    if (!currentUserEmail) {
      toast.error("Cannot remove signer without user details.");
      return;
    }

    // Validation checks
    if (signerRecord.signed === "true") {
      toast.warning("Cannot remove a signer who has already signed the document.");
      return;
    }
    if (signerRecord.emailToSign === roomDetails?.ownerEmail) {
      toast.error("The room owner cannot be removed as a signer.");
      return;
    }

    const removalKey = `${documentId}-${signerRecord.emailToSign}`;
    setIsRemovingSigner(removalKey);
    const toastId = toast.loading(`Removing ${signerRecord.emailToSign}...`);
    const document = documents.find(doc => doc.documentId === documentId);

    const input: RemoveSignerFromDocumentInput = {
      roomId,
      documentId,
      callerEmail: currentUserEmail,
      signerEmailToRemove: signerRecord.emailToSign,
      roomName: roomDetails.roomName,
      companyName,
      documentName: document?.originalFilename || 'a document',
    };

    try {
      const result: ModifySignerResult = await removeSignerFromDocumentClientAction(input);
      if (result.success) {
        toast.success("Signer Removed", { id: toastId, description: result.message });
        // Remove signer from state instead of full reload
        stateUpdater.removeSignerFromDocument(documentId, signerRecord.emailToSign);
        // Add log entry for the activity
        const documentName = document?.originalFilename || 'a document';
        stateUpdater.addLog(currentUserEmail!, `Removed ${signerRecord.emailToSign} as a signer for document '${documentName}'.`);
        // Invalidate cache since document signer list has changed
        documentCache.invalidate(documentId);
        console.log(`[DocumentCache] Invalidated cache for document ${documentId} after removing signer`);
      } else {
        throw new Error(result.error || result.message || "Failed to remove signer.");
      }
    } catch (error: any) {
      toast.error("Error", { id: toastId, description: error.message });
    } finally {
      setIsRemovingSigner(null);
    }
  }, [currentUserEmail, roomId, roomDetails?.ownerEmail, documentCache, documents]);

  // Initialize signers with room owner when upload modal opens
  const initializeSigners = useCallback(() => {
    if (roomDetails?.ownerEmail) {
      // Always ensure room owner is included, but don't duplicate
      if (!signers.includes(roomDetails.ownerEmail)) {
        setSigners(prev => {
          const newSigners = prev.filter(email => email !== roomDetails.ownerEmail);
          return [roomDetails.ownerEmail, ...newSigners];
        });
      }
    }
  }, [roomDetails?.ownerEmail, signers]);

  return {
    // Upload modal signer state
    signers,
    setSigners,
    signerInput,
    setSignerInput,
    isSignerSuggestionsOpen,
    setIsSignerSuggestionsOpen,
    
    // Add signer modal state
    isAddSignerModalOpen,
    setIsAddSignerModalOpen,
    addSignerDocDetails,
    setAddSignerDocDetails,
    newSignerEmail,
    setNewSignerEmail,
    isSubmittingSigner,
    isRemovingSigner,
    
    // Actions
    handleAddSigner,
    handleRemoveSigner,
    handleOpenAddSignerModal,
    handleAddSignerToDocument,
    handleRemoveSignerFromDocument,
    initializeSigners
  };
} 