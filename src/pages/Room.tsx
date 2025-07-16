/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import RequireLogin from "../components/RequireLogin";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../components/ui/dialog";
import { MessageSquare, CalendarDays, UserCircle, BadgeInfo, BadgeDollarSign, Copy, RefreshCw, AlertTriangle, Terminal, Check, UserPlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { CustomLoader } from "../components/ui/CustomLoader";
import { useApi, useActiveAddress } from '@arweave-wallet-kit/react';
import { format } from 'date-fns';
import { useActionState } from "react";
import { useConnection } from "@arweave-wallet-kit/react";
import { type RoomDetails, type DocumentInfo, type ModifyMemberResult, type UploadDocumentResult, type RetrieveDocumentResult, type RoomDocument, type GetRoomDetailsResult, MAX_FILE_SIZE } from "../types/types";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from "../components/ui/sheet";
import DocumentSigningModal from "./components/DocumentSigningModal";
import { decryptKmsAction } from "../actions/decryptKmsAction";
import DocumentTimeline from "./components/DocumentTimeline";
import RoleManager from "./components/RoleManager";
import MemberManager from "./components/MemberManager";
import DocumentViewModal from "./components/DocumentViewModal";
import DocumentsTab from "./components/DocumentsTab";
import {
  addMemberFormAdapter,
  removeMemberFormAdapter,
  getRoomDetailsAction,
  retrieveDocumentClientAction,
  signDocumentClientAction,
  uploadDocumentFormAdapter,
  addSignerToDocumentClientAction,
  removeSignerFromDocumentClientAction
} from '../services/roomActionsClient';
import {
  type RetrieveDocumentApiInput,
  type SignDocumentApiInput,
  type SignDocumentResult,
  type AddSignerToDocumentInput,
  type RemoveSignerFromDocumentInput,
  type ModifySignerResult
} from '../types/types';
import { Command, CommandGroup, CommandItem, CommandList } from "../components/ui/command";

export default function RoomDetailsPage() {
  const params = useParams();
  const api = useApi();
  const activeAddress = useActiveAddress();
  const connected = useConnection().connected;
  const roomId = params.companyId as string;

  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isViewingDoc, setIsViewingDoc] = useState<string | null>(null);
  const [isDownloadingDoc, setIsDownloadingDoc] = useState<string | null>(null);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [isInitialDocLoaded, setIsInitialDocLoaded] = useState(false);

  const uploadFormRef = useRef<HTMLFormElement>(null);
  const addMemberFormRef = useRef<HTMLFormElement>(null);

  const [uploadState, uploadFormAction, isUploadPending] = useActionState<UploadDocumentResult | null, FormData>(
    uploadDocumentFormAdapter,
    null
  );
  const [addMemberState, addMemberFormAction, isAddMemberPending] = useActionState<ModifyMemberResult | null, FormData>(
    addMemberFormAdapter,
    null
  );
  const [removeMemberState, removeMemberFormAction, isRemoveMemberPending] = useActionState<ModifyMemberResult | null, FormData>(
    removeMemberFormAdapter,
    null
  );

  useEffect(() => {

  }, [isUploadPending, isAddMemberPending, isRemoveMemberPending, addMemberFormAction, removeMemberFormAction, isAddMemberModalOpen])

  const [selectedDocument, setSelectedDocument] = useState<RoomDocument | null>(null);
  const [viewerDocuments, setViewerDocuments] = useState<any[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const objectUrlsRef = useRef<string[]>([]);
  if (objectUrlsRef) {

  }
  const [userPlan, setUserPlan] = useState<string | null>(null);

  const [isTemplatesSidebarOpen, setIsTemplatesSidebarOpen] = useState(false);

  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);
  const [isSigningDoc, setIsSigningDoc] = useState<string | null>(null);

  const [signers, setSigners] = useState<string[]>([]);
  const [signerInput, setSignerInput] = useState("");
  const [isSignerSuggestionsOpen, setIsSignerSuggestionsOpen] = useState(false);

  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signingDocumentId, setSigningDocumentId] = useState<string | null>(null);
  const [signingDocumentData, setSigningDocumentData] = useState<string | null>(null);
  const [signingDocumentName, setSigningDocumentName] = useState<string>("");
  const [signingDocumentType, setSigningDocumentType] = useState<string>("");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalDocData, setViewModalDocData] = useState<string | null>(null);
  const [isPreparingView, setIsPreparingView] = useState(false);

  const [isAddSignerModalOpen, setIsAddSignerModalOpen] = useState(false);
  const [addSignerDocDetails, setAddSignerDocDetails] = useState<{ documentId: string; currentSigners: string[] } | null>(null);
  const [newSignerEmail, setNewSignerEmail] = useState("");
  const [isSubmittingSigner, setIsSubmittingSigner] = useState(false);
  const [isRemovingSigner, setIsRemovingSigner] = useState<string | null>(null); // "docId-email@domain.com"
  const [isAddSignerSuggestionsOpen, setIsAddSignerSuggestionsOpen] = useState(false);

  useEffect(() => {
    if (roomDetails) {
      document.title = `PermaSign | ${roomDetails.roomName}`;
    } else {
      document.title = "PermaSign | Loading Company...";
    }
  }, [roomDetails]);

  useEffect(() => {
    // This useEffect was empty, can be kept or removed if not needed for other purposes.
    // console.log("Signing Document Name/Type updated:", signingDocumentName, signingDocumentType);
  }, [setSigningDocumentName, setSigningDocumentType])

  useEffect(() => {
    const getOthentEmail = async () => {
      if (connected && api?.othent && activeAddress && !currentUserEmail) {
        console.log("Fetching Othent email for current user...");
        try {
          const othentData: any = await api.othent.getUserDetails();
          if (othentData?.email) {
            setCurrentUserEmail(othentData.email);
            console.log("Current user email set:", othentData.email);
          } else {
            console.warn("Othent details fetched but missing email.");
            toast.error("Email Not Found", { description: "Could not retrieve your email from Othent." });
          }
        } catch (error: any) {
          console.error("Failed to fetch Othent details:", error);
          toast.error("Error Fetching User Details", { description: `Could not retrieve your email: ${error.message || 'Unknown error'}.` });
        }
      } else if (!connected && currentUserEmail) {
        setCurrentUserEmail(null);
      }
    };
    getOthentEmail();
  }, [connected, api, activeAddress, currentUserEmail]);

  const fetchRoomDetails = useCallback(async () => {
    if (!roomId || !currentUserEmail) return;
    console.log(`Fetching details for room ${roomId} as ${currentUserEmail}`);
    setIsLoadingDetails(true);
    setDetailsError(null);
    setDocuments([]);
    try {
      const result: GetRoomDetailsResult = await getRoomDetailsAction(roomId, currentUserEmail);
      console.log("room details result", result);
      if (result.success && result.data) {
        setRoomDetails(result.data);
        setDocuments(result.data.documentDetails || []);
        console.log(`Room details loaded. Found ${result.data.documentDetails?.length ?? 0} document entries.`);
      } else {
        setDetailsError(result.error || result.message || "Failed to fetch room details.");
        toast.error("Failed to load room", { description: result.error || result.message || "Could not retrieve room details." });
        setRoomDetails(null);
        setDocuments([]);
      }
    } catch (error: any) {
      setDetailsError(error.message || "An unexpected error occurred.");
      toast.error("Error Loading Room", { description: error.message || "Could not retrieve room details." });
      setRoomDetails(null);
      setDocuments([]);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [roomId, currentUserEmail]);

  useEffect(() => {
    if (currentUserEmail) {
      fetchRoomDetails();
    } else {
      setRoomDetails(null);
      setDocuments([]);
      setIsLoadingDetails(true);
    }
  }, [fetchRoomDetails, currentUserEmail]);

  // [NEW] This effect runs when documents are first loaded to show a preview.
  useEffect(() => {
    if (!isInitialDocLoaded && documents.length > 0) {
      const latestDoc = [...documents].sort((a, b) => b.uploadedAt - a.uploadedAt)[0];
      if (latestDoc) {
        handleViewDocument(latestDoc.documentId);
        setIsInitialDocLoaded(true);
      }
    }
  // We only want this to run when documents change from empty to populated.
  // Adding other dependencies would change the behavior.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
  };

  useEffect(() => {
    if (uploadState) {
      if (uploadState.success) {
        toast.success("Upload Successful", {
          description: uploadState.message,
          action: uploadState.arweaveTx?.contentTxId ? { label: "View Content Tx", onClick: () => window.open(`https://viewblock.io/arweave/tx/${uploadState.arweaveTx!.contentTxId}`, '_blank') } : undefined,
        });
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setFileError(null);
        if (uploadFormRef.current) uploadFormRef.current.reset();
        fetchRoomDetails();
      } else {
        toast.error("Upload Failed", {
          description: uploadState.message + (uploadState.error ? ` Details: ${uploadState.error}` : ''),
          duration: 7000,
        });
      }
    }
  }, [uploadState, fetchRoomDetails]);

  useEffect(() => {
    const handleMemberActionResult = (state: ModifyMemberResult | null, actionType: string) => {
      if (state) {
        if (state.success) {
          toast.success(`${actionType} Successful`, { description: state.message });
          if (actionType === "Add Member") {
            setIsAddMemberModalOpen(false);
            if (addMemberFormRef.current) addMemberFormRef.current.reset();
          }
          fetchRoomDetails();
        } else {
          toast.error(`Failed to ${actionType.toLowerCase()}`, {
            description: state.error || state.message || "An unknown error occurred.",
            duration: 7000
          });
        }
      }
    };
    handleMemberActionResult(addMemberState, "Add Member");
  }, [addMemberState, fetchRoomDetails]);

  useEffect(() => {
    const handleMemberActionResult = (state: ModifyMemberResult | null, actionType: string) => {
      if (state) {
        if (state.success) {
          toast.success(`${actionType} Successful`, { description: state.message });
          fetchRoomDetails();
        } else {
          toast.error(`Failed to ${actionType.toLowerCase()}`, {
            description: state.error || state.message || "An unknown error occurred.",
            duration: 7000
          });
        }
      }
    };
    handleMemberActionResult(removeMemberState, "Remove Member");
  }, [removeMemberState, fetchRoomDetails]);

  const retrieveAndDecrypt = async (
        document: DocumentInfo,
        decryptedRoomPrivateKeyPem: string
    ): Promise<RetrieveDocumentResult> => {
    if (!currentUserEmail) {
      toast.error("User details not loaded", { description: "Cannot retrieve document without user email."});
      return { success: false, message: "User email missing." };
    }
    if (!decryptedRoomPrivateKeyPem) {
         toast.error("Decryption Key Error", { description: "Cannot retrieve document without the decrypted room key."});
         return { success: false, message: "Decrypted room private key is missing." };
    }

    const input: RetrieveDocumentApiInput = {
        ...document,
        userEmail: currentUserEmail,
        decryptedRoomPrivateKeyPem
    };
    const result = await retrieveDocumentClientAction(input);
    return result;
  };

  const getDecryptedRoomKey = async (): Promise<string | null> => {
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
  };

  // === Function added back ===
  // Helper function to trigger browser download from base64 data
  const downloadFileFromBase64 = (base64Data: string, fileName: string, contentType: string) => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName; // Set download attribute
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Revoke after download initiated
      // Optional: Move success toast here if needed
      // toast.success("Download Started", { description: `Your browser is downloading '${fileName}'.` });
    } catch (error) {
      console.error("Failed to initiate download:", error);
      toast.error("Download Failed", { description: "Could not prepare the file for download." });
    }
  };

  async function handleViewDocument(documentId: string) {
    if (isViewingDoc || isDownloadingDoc) return;

    const docToView = documents.find(doc => doc.documentId === documentId);
    if (!docToView) {
      toast.error("Document not found");
      return;
    }

    setSelectedDocument(docToView);
    setIsViewingDoc(documentId);
    setIsDecrypting(true);
    // Clear previous viewer documents to ensure a clean state
    setViewerDocuments([]);

    try {
        const decryptedKey = await getDecryptedRoomKey();
        if (!decryptedKey) {
             throw new Error("Failed to obtain decrypted room key.");
        }
        setIsDecrypting(true);

        console.log(`Calling retrieveAndDecrypt for ${documentId}`);
        const result = await retrieveAndDecrypt(docToView, decryptedKey);

      if (result.success && result.data) {
        // [MODIFIED] Use a stable data URI instead of a temporary object URL.
        // This prevents the browser from discarding the preview on tab change.
        const dataUri = `data:${result.data.contentType};base64,${result.data.decryptedData}`;

        setViewerDocuments([{
          uri: dataUri,
          fileName: result.data.filename,
          fileType: result.data.contentType
        }]);

        toast.success("Document decrypted successfully");
      } else {
        toast.error(`Failed to retrieve/decrypt document: ${result.error || result.message}`);
      }
    } catch (error: any) {
      console.error("Error viewing document:", error);
      if (!error.message.includes("decrypted room key")) {
           toast.error(`Error viewing document: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsViewingDoc(null);
      setIsDecrypting(false);
    }
  }

  async function handleDownloadDocument(documentId: string) {
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
        downloadFileFromBase64(decryptedData, filename, contentType);
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
  }

  const currentUserRole = roomDetails?.members.find(m => m.userEmail === currentUserEmail)?.role;

  const isFounder = currentUserRole === 'founder';
  // const isCFO = currentUserRole === 'cfo';
  // const isInvestor = currentUserRole === 'investor';
  // const isAuditor = currentUserRole === 'auditor';

  // const canUpload = true;
  // const canManageMembers = isFounder || isCFO;
  // const canAddCFO = isFounder;
  // const canAddInvestor = isFounder || isCFO;
  // const canAddAuditor = isInvestor;
  // const canAddCustomer = isFounder || isCFO;
  // const canAddVendor = isFounder || isCFO;
  // const canAddAnyMember = canAddCFO || canAddInvestor || canAddAuditor || canAddCustomer || canAddVendor;

  useEffect(() => {
    const fetchUserPlan = async () => {
      setUserPlan("Power Pack");
    };
    if (currentUserEmail) {
      fetchUserPlan();
    }
  }, [currentUserEmail]);

  // const availableTemplates = [
  //   { id: 'nda', name: 'Non-Disclosure Agreement (NDA)', description: 'Standard mutual NDA for confidential discussions.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
  //   { id: 'saft', name: 'Simple Agreement for Future Tokens (SAFT)', description: 'Agreement for future token issuance.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
  //   { id: 'employ', name: 'Employment Agreement', description: 'Standard contract for hiring new employees.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
  //   { id: 'advisor', name: 'Advisor Agreement', description: 'Contract for engaging company advisors.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
  //   { id: 'term_sheet', name: 'Term Sheet (Seed Round)', description: 'Outline of terms for a seed investment.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
  //   { id: 'msa', name: 'Master Service Agreement (MSA)', description: 'General agreement for service provision.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
  // ];

  const handleOpenUploadModal = (category: string) => {
    setPreselectedCategory(category);
    setIsUploadModalOpen(true);
  };

  const handleSignDocument = async (documentId: string) => {
    if (isSigningDoc) {
      console.log("Signing already in progress for:", isSigningDoc);
      return;
    }
    if (!currentUserEmail || !currentUserRole || !roomId) {
        toast.error("Cannot Sign", { description: "Missing user details, role, or room ID."});
        setIsSigningDoc(null);
        return;
    }

    console.log(`Attempting to sign document: ${documentId}`);
    setIsSigningDoc(documentId);
    console.log(`isSigningDoc state set to: ${documentId}`);

    try {
      const dataToSign = documentId; // The data to sign is the documentId string itself
      const signatureArrayBuffer = await api?.signature(
        dataToSign, // data
        { name: 'RSA-PSS', saltLength: 32 } // algorithm options
      );
      console.log("Signing document data (documentId):", dataToSign);
      

      if (!signatureArrayBuffer || !(signatureArrayBuffer instanceof Uint8Array)) {
        throw new Error("Signature generation failed or returned an invalid type.");
      }
      
      const hexSignature = "0x" + Array.from(signatureArrayBuffer)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      
      console.log("Generated signature (hex):", hexSignature);

      const input: SignDocumentApiInput = { // Create the input object
        documentId,
        roomId, // roomId is available in the component's scope
        emailToSign: currentUserEmail, // email of the person signing
        signature: hexSignature,
        roleToSign: currentUserRole // role of the person signing
      };

      // Call the new client-side action
      const result: SignDocumentResult = await signDocumentClientAction(input);

      if (result.success) {
        toast.success(`Document signed successfully`, {
          description: result.message || "The signature has been recorded successfully"
        });
        console.log("Signing successful for:", documentId);
        fetchRoomDetails(); // Refresh details to show updated signature status
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
      // Close modal if it was open and signing is done (modal's responsibility via onSign promise)
    }
  };

  const openSigningModal = async (documentId: string) => {
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
        const result = await retrieveAndDecrypt(docToSign, decryptedKey);

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
  };

  useEffect(() => {
    if (isUploadModalOpen && roomDetails?.ownerEmail) {
        if (signers.length === 0) {
            setSigners([roomDetails.ownerEmail]);
        }
    }
  }, [isUploadModalOpen, roomDetails?.ownerEmail, signers.length]);

  const handleAddSigner = (email?: string) => {
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
  };

  const handleRemoveSigner = (emailToRemove: string) => {
    if (emailToRemove === roomDetails?.ownerEmail) {
        toast.error("The room owner cannot be removed as a signer.");
        return;
    }
    setSigners(signers.filter(signer => signer !== emailToRemove));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // This is a generic check. A more robust way would be to use specific refs or IDs
      // if multiple such popovers could exist on the same view. For now, this works
      // because only one modal with this functionality can be open at a time.
      if (!target.closest('.signer-input-container')) {
        if (isSignerSuggestionsOpen) {
          setIsSignerSuggestionsOpen(false);
        }
        if (isAddSignerSuggestionsOpen) {
          setIsAddSignerSuggestionsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSignerSuggestionsOpen, isAddSignerSuggestionsOpen]);

  const handleOpenAddSignerModal = (documentId: string) => {
    const currentSigners = documents
      .filter(d => d.documentId === documentId)
      .map(d => d.emailToSign);
    setAddSignerDocDetails({ documentId, currentSigners: currentSigners as string[] });
    setIsAddSignerModalOpen(true);
  };

  const handleAddSignerToDocument = async () => {
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

    const input: AddSignerToDocumentInput = {
      roomId,
      documentId: addSignerDocDetails.documentId,
      callerEmail: currentUserEmail,
      signerEmail: newSignerEmail,
    };

    try {
      const result: ModifySignerResult = await addSignerToDocumentClientAction(input);
      if (result.success) {
        toast.success("Signer Added", { id: toastId, description: result.message });
        setIsAddSignerModalOpen(false);
        setNewSignerEmail("");
        setAddSignerDocDetails(null);
        fetchRoomDetails();
      } else {
        throw new Error(result.error || result.message || "Failed to add signer.");
      }
    } catch (error: any) {
      toast.error("Error", { id: toastId, description: error.message });
    } finally {
      setIsSubmittingSigner(false);
    }
  };

  const handleRemoveSignerFromDocument = async (documentId: string, signerRecord: { emailToSign: string, signed: string }) => {
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

    const input: RemoveSignerFromDocumentInput = {
      roomId,
      documentId,
      callerEmail: currentUserEmail,
      signerEmailToRemove: signerRecord.emailToSign,
    };

    try {
      const result: ModifySignerResult = await removeSignerFromDocumentClientAction(input);
      if (result.success) {
        toast.success("Signer Removed", { id: toastId, description: result.message });
        fetchRoomDetails();
      } else {
        throw new Error(result.error || result.message || "Failed to remove signer.");
      }
    } catch (error: any) {
      toast.error("Error", { id: toastId, description: error.message });
    } finally {
      setIsRemovingSigner(null);
    }
  };

  const handleOpenViewModal = async (docToView: DocumentInfo) => {
    if (!docToView) {
        toast.error("Document details are missing.");
        return;
    }

    // This sets the details for the modal.
    setSelectedDocument(docToView);

    setIsPreparingView(true);
    setIsViewModalOpen(true);
    setViewModalDocData(null); // Clear previous data

    try {
        const decryptedKey = await getDecryptedRoomKey();
        if (!decryptedKey) {
            throw new Error("Failed to obtain decrypted room key for preview.");
        }

        const result = await retrieveAndDecrypt(docToView, decryptedKey);

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
  };

  const handleExpandView = async () => {
    if (!selectedDocument) {
        toast.error("No document selected to expand.");
        return;
    }
    handleOpenViewModal(selectedDocument);
  };

  if (isLoadingDetails) {
    return <CustomLoader text="Loading company details..." />;
  }

  if (detailsError) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4 text-center">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center gap-2">
              <AlertTriangle /> Error Loading Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{detailsError}</p>
            <Button onClick={fetchRoomDetails} variant="outline" className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roomDetails) {
    return <CustomLoader text="Initializing..." />;
  }

  const roomPublicKey = roomDetails.roomPubKey;
  if (!roomPublicKey) {
      console.error("CRITICAL: Room public key is missing from room details! Uploads will be disabled.");
  }

  // [MODIFIED] This correctly gets the allowed document types for the current user's role.
  const currentUserRoleDetails = roomDetails.roomRoles.find(r => r.roleName === currentUserRole);
  const allowedUploadCategories = currentUserRoleDetails ? currentUserRoleDetails.documentTypes : [];

  const sortedRoles = [...roomDetails.roomRoles]
    .filter(role => role.documentTypes.length > 0)
    .sort((a, b) => {
      if (a.roleName === 'founder') return -1;
      if (b.roleName === 'founder') return 1;
      return a.roleName.localeCompare(b.roleName);
    });

  const defaultOpenRoles = sortedRoles.map(role => role.roleName);

  return (
    <RequireLogin>
      <div className="flex flex-col h-screen -mt-12 relative">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">{roomDetails.roomName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center" title={`Created on ${format(new Date(roomDetails.createdAt), 'PPP')}`}>
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                  {format(new Date(roomDetails.createdAt), 'PP')}
                </span>
                <span className="flex items-center" title={`Owner: ${roomDetails.ownerEmail}`}>
                  <UserCircle className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                  {roomDetails.ownerEmail}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sheet open={isTemplatesSidebarOpen} onOpenChange={setIsTemplatesSidebarOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Copy className="mr-2 h-4 w-4" /> Document Templates
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col">
                  <div className="border-b p-4 flex items-center justify-between">
                    <SheetTitle className="flex items-center">
                      <Copy className="mr-2 h-5 w-5 text-primary" />
                      Use a Template
                    </SheetTitle>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
                    <Terminal className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">Feature Coming Soon!</h3>
                    <p className="text-sm text-muted-foreground/80 text-center mt-2">
                      Pre-built document templates are under development.
                    </p>
                    <p className="text-sm text-muted-foreground/80 text-center">
                      Stay tuned for updates!
                    </p>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex flex-col items-end space-y-1">
                {userPlan && (
                  <div className="flex items-center text-xs font-medium bg-secondary/80 text-secondary-foreground px-2.5 py-1 rounded-full" title="Your current subscription plan">
                    <BadgeDollarSign className="h-3.5 w-3.5 mr-1.5" />
                    Plan - <span className="font-bold ml-1">{userPlan}</span>
                  </div>
                )}
                {currentUserEmail && (
                  <div className="flex items-center text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full" title="Your role in this room">
                    <BadgeInfo className="h-3.5 w-3.5 mr-1.5" />
                    Role: <span className="capitalize ml-1">{currentUserRole || 'Unknown'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="documents" className="h-full flex flex-col">
            <div className="flex justify-center">
              <TabsList className="mt-2">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="members">Members ({roomDetails.members.length})</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden px-4 pb-4">
              <TabsContent value="timeline" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <Tabs defaultValue="activity" className="h-full flex flex-col">
                  <div className="flex justify-center">
                    <TabsList className="w-auto">
                      <TabsTrigger value="activity" className="text-xs px-3 py-1 h-auto">Document Trail</TabsTrigger>
                      <TabsTrigger value="logs" className="text-xs px-3 py-1 h-auto">Company Logs</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="activity" className="flex-1 overflow-auto p-4 w-full">
                    {isLoadingDetails ? (
                      <div className="flex items-center justify-center h-full">
                        <CustomLoader text="Loading document timeline..." />
                      </div>
                    ) : (
                      <DocumentTimeline documents={documents} />
                    )}
                  </TabsContent>
                  <TabsContent value="logs" className="flex-1 overflow-auto p-4 w-full">
                    <div className="bg-background rounded-md h-full flex justify-center">
                      <div className="self-start w-full max-w-5xl">
                        {roomDetails.activityLogs && roomDetails.activityLogs.length > 0 ? (
                          <div className="font-mono text-xs text-muted-foreground space-y-2">
                            {roomDetails.activityLogs.map((log, index) => (
                              <div key={index} className="flex items-start gap-x-4 p-2 hover:bg-muted/50 rounded-md">
                                <span className="w-40 flex-shrink-0">{new Date(parseInt(log.timestamp)).toLocaleString()}</span>
                                <span className="font-medium w-48 flex-shrink-0 text-foreground">{log.actor}</span>
                                <span className="whitespace-pre-wrap">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-12">
                            <Terminal className="h-12 w-12 mb-4" />
                            <p className="text-lg">No activity logs found for this room.</p>
                          </div>
                        )}
                        <p className="text-center text-xs text-muted-foreground mt-6 italic">
                          Note: Company logs are only recorded from 8th July 2025.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              <TabsContent value="documents" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <DocumentsTab
                  roomDetails={roomDetails!}
                  documents={documents}
                  currentUserEmail={currentUserEmail}
                  currentUserRole={currentUserRole || null}
                  isLoadingDetails={isLoadingDetails}
                  detailsError={detailsError}
                  selectedDocument={selectedDocument}
                  viewerDocuments={viewerDocuments}
                  isDecrypting={isDecrypting}
                  isViewingDoc={isViewingDoc}
                  isDownloadingDoc={isDownloadingDoc}
                  isPreparingView={isPreparingView}
                  isUploadModalOpen={isUploadModalOpen}
                  selectedFile={selectedFile}
                  fileError={fileError}
                  signers={signers}
                  signerInput={signerInput}
                  isSignerSuggestionsOpen={isSignerSuggestionsOpen}
                  preselectedCategory={preselectedCategory}
                  uploadFormRef={uploadFormRef as React.RefObject<HTMLFormElement>}
                  uploadState={uploadState}
                  isSigningDoc={isSigningDoc}
                  isSigningModalOpen={isSigningModalOpen}
                  isAddSignerModalOpen={isAddSignerModalOpen}
                  addSignerDocDetails={addSignerDocDetails}
                  newSignerEmail={newSignerEmail}
                  isSubmittingSigner={isSubmittingSigner}
                  isAddSignerSuggestionsOpen={isAddSignerSuggestionsOpen}
                  isRemovingSigner={isRemovingSigner}
                  onFetchRoomDetails={fetchRoomDetails}
                  onViewDocument={handleViewDocument}
                  onDownloadDocument={handleDownloadDocument}
                  onOpenUploadModal={handleOpenUploadModal}
                  onOpenSigningModal={openSigningModal}
                  onOpenViewModal={handleOpenViewModal}
                  onExpandView={handleExpandView}
                  onOpenAddSignerModal={handleOpenAddSignerModal}
                  onAddSignerToDocument={handleAddSignerToDocument}
                  onRemoveSignerFromDocument={handleRemoveSignerFromDocument}
                  onSetIsUploadModalOpen={setIsUploadModalOpen}
                  onSetSelectedFile={setSelectedFile}
                  onSetFileError={setFileError}
                  onSetSigners={setSigners}
                  onSetSignerInput={setSignerInput}
                  onSetIsSignerSuggestionsOpen={setIsSignerSuggestionsOpen}
                  onSetPreselectedCategory={setPreselectedCategory}
                  onSetIsAddSignerModalOpen={setIsAddSignerModalOpen}
                  onSetNewSignerEmail={setNewSignerEmail}
                  onSetIsAddSignerSuggestionsOpen={setIsAddSignerSuggestionsOpen}
                  onSetAddSignerDocDetails={setAddSignerDocDetails}
                  uploadFormAction={uploadFormAction}
                  onFileChange={handleFileChange}
                  onAddSigner={handleAddSigner}
                  onRemoveSigner={handleRemoveSigner}
                />
              </TabsContent>

              <TabsContent value="members" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <MemberManager
                  roomDetails={roomDetails}
                  currentUserEmail={currentUserEmail}
                  fetchRoomDetails={fetchRoomDetails}
                />
              </TabsContent>

              <TabsContent value="settings" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <div className="flex-1 overflow-auto">
                      <RoleManager
                          roomDetails={roomDetails}
                          currentUserEmail={currentUserEmail}
                          fetchRoomDetails={fetchRoomDetails}
                      />
                  </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <Button
          onClick={() => setIsChatSidebarOpen(true)}
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
          size="icon"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        

        <Sheet open={isChatSidebarOpen} onOpenChange={setIsChatSidebarOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <SheetTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                Chat with Documents
              </SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
              <Terminal className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Feature Coming Soon!</h3>
              <p className="text-sm text-muted-foreground/80 text-center mt-2">
                AI-powered chat with your room's documents is under development.
              </p>
              <p className="text-sm text-muted-foreground/80 text-center">
                Stay tuned for updates!
              </p>
            </div>
          </SheetContent>
        </Sheet>

        <DocumentSigningModal
          isOpen={isSigningModalOpen}
          onClose={() => {
            setIsSigningModalOpen(false);
            setSigningDocumentId(null);
            setSigningDocumentData(null);
          }}
          documentId={signingDocumentId || ""}
          documentName={signingDocumentName}
          documentData={signingDocumentData || undefined}
          contentType={signingDocumentType}
          isSigning={isSigningDoc === signingDocumentId}
          onSign={handleSignDocument}
        />

        <DocumentViewModal
            isOpen={isViewModalOpen}
            onClose={() => {
                setIsViewModalOpen(false);
                setViewModalDocData(null);
            }}
            documentName={selectedDocument?.originalFilename || ""}
            documentData={viewModalDocData || undefined}
            contentType={selectedDocument?.contentType || ""}
            isLoading={isPreparingView}
        />

        <Dialog open={isAddSignerModalOpen} onOpenChange={(isOpen) => {
            setIsAddSignerModalOpen(isOpen);
            if (!isOpen) {
                setNewSignerEmail("");
                setAddSignerDocDetails(null);
                setIsAddSignerSuggestionsOpen(false);
            }
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Signer</DialogTitle>
                    <DialogDescription>
                        Enter the email of the new signer. They will be required to sign this document.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-signer-email" className="text-right">
                            Email
                        </Label>
                        <div className="col-span-3 signer-input-container relative">
                            <Input
                                id="new-signer-email"
                                value={newSignerEmail}
                                onChange={(e) => setNewSignerEmail(e.target.value)}
                                onFocus={() => setIsAddSignerSuggestionsOpen(true)}
                                className="w-full"
                                placeholder="new.signer@example.com"
                                autoComplete="off"
                            />
                            {isAddSignerSuggestionsOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
                                    <Command>
                                        <CommandList className="max-h-[200px] overflow-auto">
                                            {(() => {
                                                const filteredMembers = roomDetails?.members
                                                    .filter(member =>
                                                        !addSignerDocDetails?.currentSigners.includes(member.userEmail) &&
                                                        member.userEmail.toLowerCase().includes(newSignerEmail.toLowerCase())
                                                    ) || [];

                                                const hasValidEmail = newSignerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSignerEmail);
                                                const isExistingMember = roomDetails?.members.some(m => m.userEmail === newSignerEmail);
                                                const isAlreadySigner = addSignerDocDetails?.currentSigners.includes(newSignerEmail);

                                                return (
                                                    <>
                                                        {filteredMembers.length > 0 && (
                                                            <CommandGroup heading="Room Members">
                                                                {filteredMembers.map(member => (
                                                                    <CommandItem
                                                                        key={member.userEmail}
                                                                        value={member.userEmail}
                                                                        onSelect={() => {
                                                                            setNewSignerEmail(member.userEmail);
                                                                            setIsAddSignerSuggestionsOpen(false);
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                                                        <div className="flex flex-col">
                                                                            <span>{member.userEmail}</span>
                                                                            <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                        {hasValidEmail && !isExistingMember && !isAlreadySigner && (
                                                            <CommandGroup heading="Add New Signer">
                                                                <CommandItem
                                                                    value={newSignerEmail}
                                                                    onSelect={() => {
                                                                        setNewSignerEmail(newSignerEmail); // Keep the value
                                                                        setIsAddSignerSuggestionsOpen(false);
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                                    <div className="flex flex-col">
                                                                        <span>Add "{newSignerEmail}"</span>
                                                                        <span className="text-xs text-muted-foreground">Will be added as a signer</span>
                                                                    </div>
                                                                </CommandItem>
                                                            </CommandGroup>
                                                        )}
                                                        {filteredMembers.length === 0 && !hasValidEmail && newSignerEmail && (
                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                Enter a valid email address
                                                            </div>
                                                        )}
                                                        {isAlreadySigner && (
                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                This user is already a signer.
                                                            </div>
                                                        )}
                                                        {!newSignerEmail && (
                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                Type to search members or add new email
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </CommandList>
                                    </Command>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={() => { setNewSignerEmail(""); setAddSignerDocDetails(null); }}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button onClick={handleAddSignerToDocument} disabled={isSubmittingSigner || !newSignerEmail}>
                        {isSubmittingSigner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Signer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </RequireLogin>
  );
}


