import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useApi } from '@arweave-wallet-kit/react';
import { decryptKmsAction } from "../actions/decryptKmsAction";
import { retrieveDocumentClientAction, signDocumentClientAction } from '../services/roomActionsClient';
import { getDocumentCache } from "../utils/documentCache";
import { stitchPdfWithSignatures, type SignatureInfo } from "../utils/pdfStitching";
import { 
  type DocumentInfo, 
  type RetrieveDocumentResult, 
  type RetrieveDocumentApiInput,
  type SignDocumentApiInput,
  type SignDocumentResult
} from "../types/types";

interface UseDocumentOperationsProps {
  roomDetails: any;
  documents: DocumentInfo[];
  currentUserEmail: string | null;
  currentUserRole?: string | null;
  stateUpdater: any;
}

export function useDocumentOperations({
  roomDetails,
  documents,
  currentUserEmail,
  currentUserRole,
  stateUpdater
}: UseDocumentOperationsProps) {
  const api = useApi();
  const documentCache = getDocumentCache();
  
  const [isViewingDoc, setIsViewingDoc] = useState<string | null>(null);
  const [isDownloadingDoc, setIsDownloadingDoc] = useState<string | null>(null);
  const [isSigningDoc, setIsSigningDoc] = useState<string | null>(null);

  const getDecryptedRoomKey = useCallback(async (): Promise<string | null> => {
    if (!roomDetails?.encryptedRoomPvtKey) {
      toast.error("Cannot Decrypt Document", { description: "Encrypted room private key is missing from room details." });
      return null;
    }
    try {
      console.log("Attempting to decrypt room private key via KMS Action...");
      const decryptResult = await decryptKmsAction(roomDetails.encryptedRoomPvtKey);

      if (!decryptResult.success || !decryptResult.data) {
        throw new Error(decryptResult.error || "KMS decryption failed via action.");
      }
      console.log("Room private key decrypted successfully via action.");
      return decryptResult.data;
    } catch (error: any) {
      console.error("Failed to decrypt room private key:", error);
      toast.error("Decryption Failed", { description: `Could not decrypt room key: ${error.message}` });
      return null;
    }
  }, [roomDetails?.encryptedRoomPvtKey]);

  const retrieveAndDecrypt = useCallback(async (
    document: DocumentInfo,
    decryptedRoomPrivateKeyPem: string
  ): Promise<RetrieveDocumentResult> => {
    if (!currentUserEmail) {
      toast.error("User details not loaded", { description: "Cannot retrieve document without user email." });
      return { success: false, message: "User email missing." };
    }
    if (!decryptedRoomPrivateKeyPem) {
      toast.error("Decryption Key Error", { description: "Cannot retrieve document without the decrypted room key." });
      return { success: false, message: "Decrypted room private key is missing." };
    }

    // Check cache first
    const cachedResult = documentCache.get(document.documentId);
    if (cachedResult) {
      console.log(`[DocumentCache] Cache hit for document ${document.documentId}`);
      return cachedResult;
    }

    console.log(`[DocumentCache] Cache miss for document ${document.documentId}, fetching from server`);
    const input: RetrieveDocumentApiInput = {
      ...document,
      userEmail: currentUserEmail,
      decryptedRoomPrivateKeyPem
    };
    const result = await retrieveDocumentClientAction(input);

    // Cache the result if successful
    if (result.success) {
      documentCache.set(document.documentId, result);
      console.log(`[DocumentCache] Cached document ${document.documentId}`);
    }

    return result;
  }, [currentUserEmail, documentCache]);

  const downloadFileFromBase64 = useCallback((base64Data: string, fileName: string, contentType: string) => {
    try {
      const byteCharacters = atob(base64Data);
      
      // Use a more memory-efficient approach for large files
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { 
        byteArray[i] = byteCharacters.charCodeAt(i); 
      }
      
      const blob = new Blob([byteArray], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to initiate download:", error);
      toast.error("Download Failed", { description: "Could not prepare the file for download." });
    }
  }, []);

  const handleDownloadDocument = useCallback(async (documentId: string) => {
    if (isViewingDoc || isDownloadingDoc) return;

    setIsDownloadingDoc(documentId);
    const toastId = toast.loading("Processing file for download...", { description: `Fetching and decrypting ${documentId}...` });

    try {
      const docToDownload = documents.find(doc => doc.documentId === documentId);
      if (!docToDownload) {
        toast.error("Document Not Found", { id: toastId, description: "Could not find document details to process download." });
        setIsDownloadingDoc(null);
        return;
      }

      const decryptedKey = await getDecryptedRoomKey();
      if (!decryptedKey) {
        throw new Error("Failed to obtain decrypted room key.");
      }

      console.log(`Calling retrieveAndDecrypt for download: ${documentId}`);
      const result = await retrieveAndDecrypt(docToDownload, decryptedKey);

      if (result.success && result.data) {
        toast.success("Decryption Complete", { id: toastId, description: "Preparing download..." });
        const { decryptedData, filename, contentType } = result.data;

        // Check if it's a PDF and has signatures for stitching
        const isPdf = contentType === "application/pdf";
        const documentSignatures = documents.filter(d => d.documentId === documentId);
        const hasSignatures = documentSignatures.some(d => d.signed === "true");

        console.log("PDF Download Debug:", {
          isPdf,
          contentType,
          documentSignaturesCount: documentSignatures.length,
          hasSignatures,
          signedDocs: documentSignatures.filter(d => d.signed === "true").length
        });

        if (isPdf && hasSignatures) {
          try {
            toast.loading("Adding signature certificates...", { id: toastId });

            // Convert base64 to Uint8Array for PDF processing
            const pdfBytes = Uint8Array.from(atob(decryptedData), c => c.charCodeAt(0));

            // Map document signatures to SignatureInfo format
            const signatures: SignatureInfo[] = documentSignatures
              .filter(d => d.signed === "true" && d.signature && d.emailToSign)
              .map(d => ({
                signerName: d.emailToSign!,
                signerEmail: d.emailToSign!,
                signature: d.signature!,
                signatureHash: d.signature!, // Use full signature as hash for professional display
                role: d.roleToSign || "member",
                timestamp: d.signedAt || Date.now() // Use actual timestamp or fallback for legacy signatures
              }));

            // Stitch PDF with signatures
            const stitchedPdfBytes = await stitchPdfWithSignatures({
              originalPdfBytes: pdfBytes,
              signatures,
              documentName: filename
            });

            // Convert back to base64 for download - use chunked approach to prevent call stack overflow
            let binaryString = '';
            const chunkSize = 8192; // Process in chunks to avoid call stack issues
            for (let i = 0; i < stitchedPdfBytes.length; i += chunkSize) {
              const chunk = stitchedPdfBytes.slice(i, i + chunkSize);
              binaryString += String.fromCharCode(...chunk);
            }
            const stitchedBase64 = btoa(binaryString);
            const stitchedFilename = filename.replace(/\.pdf$/i, '_with_signatures.pdf');

            toast.success("Signature certificates added!", { id: toastId, description: "Downloading enhanced PDF..." });
            downloadFileFromBase64(stitchedBase64, stitchedFilename, contentType);
          } catch (error: any) {
            console.error("PDF stitching failed:", error);
            toast.warning("Signature processing failed", {
              id: toastId,
              description: `Downloading original PDF. Error: ${error.message}`
            });
            // Fallback to original PDF
            downloadFileFromBase64(decryptedData, filename, contentType);
          }
        } else {
          // Download original file for non-PDFs or PDFs without signatures
          downloadFileFromBase64(decryptedData, filename, contentType);
        }
      } else {
        toast.error("Processing Failed", { id: toastId, description: result.message || result.error || "Could not process the file for download." });
      }
    } catch (error: any) {
      console.error("Error during download process:", error);
      if (!error.message.includes("decrypted room key")) {
        toast.error("Error", { id: toastId, description: `An unexpected error occurred: ${error.message || String(error)}` });
      } else {
        toast.error("Error", { id: toastId, description: `Download failed: ${error.message}` });
      }
    } finally {
      setIsDownloadingDoc(null);
    }
  }, [isViewingDoc, isDownloadingDoc, documents, getDecryptedRoomKey, retrieveAndDecrypt, downloadFileFromBase64]);

  const handleSignDocument = useCallback(async (documentId: string) => {
    if (isSigningDoc) {
      console.log("Signing already in progress for:", isSigningDoc);
      return;
    }
    if (!currentUserEmail || !currentUserRole || !roomDetails?.roomId) {
      toast.error("Cannot Sign", { description: "Missing user details, role, or room ID." });
      setIsSigningDoc(null);
      return;
    }

    console.log(`Attempting to sign document: ${documentId}`);
    setIsSigningDoc(documentId);

    try {
      const dataToSign = documentId;
      const signatureArrayBuffer = await api?.signature(
        dataToSign,
        { name: 'RSA-PSS', saltLength: 32 }
      );

      if (!signatureArrayBuffer || !(signatureArrayBuffer instanceof Uint8Array)) {
        throw new Error("Signature generation failed or returned an invalid type.");
      }

      const hexSignature = "0x" + Array.from(signatureArrayBuffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const input: SignDocumentApiInput = {
        documentId,
        roomId: roomDetails.roomId,
        emailToSign: currentUserEmail,
        signature: hexSignature,
        roleToSign: currentUserRole
      };

      const result: SignDocumentResult = await signDocumentClientAction(input);

      if (result.success) {
        toast.success(`Document signed successfully`, {
          description: result.message || "The signature has been recorded successfully"
        });
        console.log("Signing successful for:", documentId);
        // Update signature status in state instead of full reload
        stateUpdater.updateDocumentSignature(documentId, currentUserEmail, hexSignature, Date.now());
        // Add log entry for the signing activity
        const document = documents.find(doc => doc.documentId === documentId);
        const documentName = document?.originalFilename || 'a document';
        stateUpdater.addLog(currentUserEmail, `Signed the document '${documentName}'.`);
        // Invalidate cache since document now has a new signature
        documentCache.invalidate(documentId);
        console.log(`[DocumentCache] Invalidated cache for document ${documentId} after signing`);
      } else {
        throw new Error(result.error || result.message || "Failed to record signature via API.");
      }
    } catch (error: any) {
      console.error("Error signing document:", documentId, error);
      toast.error("Failed to sign document", {
        description: error.message || "There was an error recording your signature"
      });
    } finally {
      console.log(`Clearing isSigningDoc state (was: ${documentId})`);
      setIsSigningDoc(null);
    }
  }, [isSigningDoc, currentUserEmail, currentUserRole, roomDetails?.roomId, api, documentCache, documents]);

  return {
    isViewingDoc,
    isDownloadingDoc,
    isSigningDoc,
    setIsViewingDoc,
    setIsDownloadingDoc,
    setIsSigningDoc,
    getDecryptedRoomKey,
    retrieveAndDecrypt,
    handleDownloadDocument,
    handleSignDocument,
    downloadFileFromBase64
  };
} 