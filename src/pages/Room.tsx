/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RequireLogin from "../components/RequireLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Send, MessageSquare, MessageSquareCode, Fingerprint, CalendarDays, UserCircle, BadgeInfo, Sparkles, Video, BadgeDollarSign, Copy, RefreshCw, UserPlus, Trash2, UploadCloud, FileText, Download, Eye, Loader2, AlertTriangle, Terminal } from "lucide-react";
import { toast } from "sonner";
import { CustomLoader } from "../components/ui/CustomLoader";
import { useApi, useActiveAddress } from '@arweave-wallet-kit/react';
import { format } from 'date-fns';
import { useActionState } from "react";
import { useConnection } from "@arweave-wallet-kit/react";
import { RoomDetails, RoomRole, DocumentCategory, documentCategories, DocumentInfo, ModifyMemberResult, UploadDocumentResult, RetrieveDocumentResult, RoomDocument, GetRoomDetailsResult, MAX_FILE_SIZE, ACCEPTED_FILE_TYPES, ACCEPTED_FILE_TYPES_STRING, roleSpecificCategories, documentFolders } from "../types/types";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { X } from "lucide-react";
import DocumentSigningModal from "./components/DocumentSigningModal";
import UploadSubmitButton from "./components/UploadSubmitButton";
import RemoveMemberSubmitButton from "./components/RemoveMemberSubmitButton";
import AddMemberSubmitButton from "./components/AddMemberSubmitButton";
import { decryptKmsAction } from "../actions/decryptKmsAction";
import DocumentTimeline from "./components/DocumentTimeline";
import {
  addMemberFormAdapter,
  removeMemberFormAdapter,
  getRoomDetailsAction,
  retrieveDocumentClientAction,
  signDocumentClientAction,
  uploadDocumentFormAdapter
} from '../services/roomActionsClient';
import {
  RetrieveDocumentApiInput,
  SignDocumentApiInput,
  SignDocumentResult
} from '../types/types';

export default function RoomDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const activeAddress = useActiveAddress();
  const connected = useConnection().connected;
  const roomId = params.roomId as string;

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

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

  const [selectedDocument, setSelectedDocument] = useState<RoomDocument | null>(null);
  const [viewerDocuments, setViewerDocuments] = useState<any[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const objectUrlsRef = useRef<string[]>([]);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  const [isTemplatesSidebarOpen, setIsTemplatesSidebarOpen] = useState(false);

  const [preselectedCategory, setPreselectedCategory] = useState<DocumentCategory | null>(null);
  const [isSigningDoc, setIsSigningDoc] = useState<string | null>(null);

  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signingDocumentId, setSigningDocumentId] = useState<string | null>(null);
  const [signingDocumentData, setSigningDocumentData] = useState<string | null>(null);
  const [signingDocumentName, setSigningDocumentName] = useState<string>("");
  const [signingDocumentType, setSigningDocumentType] = useState<string>("");

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
        documentId: string,
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
        documentId,
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

    try {
        const decryptedKey = await getDecryptedRoomKey();
        if (!decryptedKey) {
             throw new Error("Failed to obtain decrypted room key.");
        }
        setIsDecrypting(true);

        console.log(`Calling retrieveAndDecrypt for ${documentId}`);
        const result = await retrieveAndDecrypt(documentId, decryptedKey);

      if (result.success && result.data) {
        const binaryData = atob(result.data.decryptedData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.data.contentType });

        const objectUrl = URL.createObjectURL(blob);
        objectUrlsRef.current.push(objectUrl);

        setViewerDocuments([{
          uri: objectUrl,
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
        const decryptedKey = await getDecryptedRoomKey();
         if (!decryptedKey) {
             throw new Error("Failed to obtain decrypted room key.");
         }

        console.log(`Calling retrieveAndDecrypt for download: ${documentId}`);
        const result = await retrieveAndDecrypt(documentId, decryptedKey);

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
  const isCFO = currentUserRole === 'cfo';
  const isInvestor = currentUserRole === 'investor';
  const isAuditor = currentUserRole === 'auditor';

  const canUpload = true;
  const canManageMembers = isFounder || isCFO;
  const canAddCFO = isFounder;
  const canAddInvestor = isFounder || isCFO;
  const canAddAuditor = isInvestor;
  const canAddCustomer = isFounder || isCFO;
  const canAddVendor = isFounder || isCFO;
  const canAddAnyMember = canAddCFO || canAddInvestor || canAddAuditor || canAddCustomer || canAddVendor;

  const filteredDocuments = documents.filter(doc =>
    selectedCategories.length === 0 || selectedCategories.includes(doc.category)
  );

  useEffect(() => {
    const fetchUserPlan = async () => {
      setUserPlan("Power Pack");
    };
    if (currentUserEmail) {
      fetchUserPlan();
    }
  }, [currentUserEmail]);

  const getFilteredCategoriesForRole = (role: RoomRole | null): DocumentCategory[] => {
    if (!role) return [];

    switch (role) {
      case 'founder':
      case 'cfo':
        return roleSpecificCategories.founder as DocumentCategory[];
      case 'investor':
        return roleSpecificCategories.investor as DocumentCategory[];
      case 'auditor':
        return roleSpecificCategories.auditor as DocumentCategory[];
      case 'vendor':
        return roleSpecificCategories.vendor as DocumentCategory[];
      case 'customer':
        return roleSpecificCategories.customer as DocumentCategory[];
      default:
        return [];
    }
  };

  const availableTemplates = [
    { id: 'nda', name: 'Non-Disclosure Agreement (NDA)', description: 'Standard mutual NDA for confidential discussions.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
    { id: 'saft', name: 'Simple Agreement for Future Tokens (SAFT)', description: 'Agreement for future token issuance.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
    { id: 'employ', name: 'Employment Agreement', description: 'Standard contract for hiring new employees.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
    { id: 'advisor', name: 'Advisor Agreement', description: 'Contract for engaging company advisors.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
    { id: 'term_sheet', name: 'Term Sheet (Seed Round)', description: 'Outline of terms for a seed investment.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
    { id: 'msa', name: 'Master Service Agreement (MSA)', description: 'General agreement for service provision.', icon: <FileText className="h-6 w-6 text-primary/80 mb-2" /> },
  ];

  const handleOpenUploadModal = (category: DocumentCategory) => {
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
        const result = await retrieveAndDecrypt(documentId, decryptedKey);

      if (result.success && result.data) {
        setSigningDocumentData(result.data.decryptedData);
      } else {
        toast.error(`Failed to load document preview: ${result.error || result.message}`);
        setSigningDocumentData(null);
      }
    } catch (error: any) {
      console.error("Error loading document for signing:", error);
      if (!error.message.includes("decrypted room key")) {
        toast.error(`Error loading document preview: ${error.message || "Unknown error"}`);
      }
      setSigningDocumentData(null);
    }
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

  const userRoleCategories = getFilteredCategoriesForRole(currentUserRole!);
  const filteredUploadCategories = documentCategories.filter(cat =>
    userRoleCategories.includes(cat.value)
  );

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
                    <Copy className="mr-2 h-4 w-4" /> Use Template
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[350px] sm:w-[450px] overflow-y-auto p-6">
                  <SheetHeader className="mb-5">
                    <SheetTitle className="flex items-center">
                      <Copy className="mr-2 h-5 w-5 text-primary" />
                      Use a Template
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select a template to start a new document signing process.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {availableTemplates.map((template) => (
                        <Card
                          key={template.id}
                          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors flex flex-col items-start text-left h-full"
                          onClick={() => {
                            console.log(`Selected template: ${template.name}`);
                            toast.info("Template Selected", { description: `You selected: ${template.name}. Integration pending.` });
                            setIsTemplatesSidebarOpen(false);
                          }}
                        >
                          {template.icon}
                          <h5 className="font-medium text-sm mb-1">{template.name}</h5>
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full">
                        <X className="mr-2 h-4 w-4" /> Close
                      </Button>
                    </SheetClose>
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
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="members">Members ({roomDetails.members.length})</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden px-4 pb-4">
              <TabsContent value="timeline" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 overflow-auto p-4 w-full">
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center h-full">
                      <CustomLoader text="Loading document timeline..." />
                    </div>
                  ) : detailsError ? (
                    <div className="text-center text-destructive py-4">
                      <p>Could not load document history: {detailsError}</p>
                      <Button onClick={fetchRoomDetails} variant="outline" size="sm" className="mt-2">
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry
                      </Button>
                    </div>
                  ) : (
                    <DocumentTimeline documents={documents} />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="documents" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                {isLoadingDetails ? (
                  <div className="flex-1 flex items-center justify-center">
                    <CustomLoader text="Loading documents..." />
                  </div>
                ) : detailsError ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-destructive p-4 border rounded-md bg-card">
                    <AlertTriangle className="h-8 w-8 mb-4" />
                    <p className="mb-2">Could not load room data:</p>
                    <p className="text-sm mb-4">{detailsError}</p>
                    <Button onClick={fetchRoomDetails} variant="destructive" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" /> Retry
                    </Button>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center h-full p-10 border rounded-md bg-card text-center">
                    <FileText className="h-20 w-20 text-muted-foreground/20 mb-6" />
                    <p className="text-xl font-medium text-muted-foreground mb-4">No documents found.</p>
                    <p className="text-base text-muted-foreground mb-2 max-w-lg">
                      Upload your first document to get started.
                    </p>
                    <p className="text-sm text-muted-foreground mb-8 max-w-lg">
                      All files are securely stored and encrypted.
                    </p>
                    <Dialog
                      open={isUploadModalOpen}
                      onOpenChange={(isOpen) => {
                        setIsUploadModalOpen(isOpen);
                        if (!isOpen) {
                          setPreselectedCategory(null);
                          setSelectedFile(null);
                          setFileError(null);
                          if (uploadFormRef.current) uploadFormRef.current.reset();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="lg" onClick={() => setPreselectedCategory(null)} disabled={!roomPublicKey}>
                          <UploadCloud className="mr-2 h-5 w-5" /> Upload First Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                          <DialogTitle>Upload New Document</DialogTitle>
                          <DialogDescription>
                            Select a file to encrypt and upload securely using the room's key.
                          </DialogDescription>
                        </DialogHeader>
                        <form ref={uploadFormRef} action={uploadFormAction}>
                          <input type="hidden" name="roomId" value={roomId} />
                          <input type="hidden" name="uploaderEmail" value={currentUserEmail || ""} />
                          <input type="hidden" name="role" value={currentUserRole || ""} />
                          <input type="hidden" name="roomPubKey" value={roomPublicKey || ""} />
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="documentFile" className="text-right">File <span className="text-destructive">*</span></Label>
                              <Input id="documentFile" name="documentFile" type="file" className="col-span-3" onChange={handleFileChange} required />
                            </div>
                            {fileError && <p className="col-span-4 text-sm text-destructive text-center">{fileError}</p>}
                            {selectedFile && <p className="col-span-4 text-sm text-muted-foreground text-center">Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="category" className="text-right">Category <span className="text-destructive">*</span></Label>
                              <Select name="category" required key={preselectedCategory} defaultValue={preselectedCategory ?? undefined}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>
                                  {filteredUploadCategories.length > 0 ? (
                                    filteredUploadCategories.map(cat => (
                                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available for your role.</div>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {uploadState && !uploadState.success && (
                            <p className="text-sm text-destructive text-center pb-4">
                              Error: {uploadState.message} {uploadState.error ? `(${uploadState.error})` : ''}
                            </p>
                          )}
                          {!roomPublicKey && (
                                <p className="text-sm text-destructive text-center pb-4">
                                    Error: Cannot upload - Room Public Key is missing.
                                </p>
                            )}
                          <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <UploadSubmitButton />
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="flex h-[calc(100vh-180px)] space-x-4">
                    <div className="w-1/2 overflow-auto border rounded-md bg-card">
                      <div className="flex h-full">
                        <div className="w-1/2 border-r p-3 overflow-y-auto">
                          <h3 className="font-medium mb-3 text-sm">All Documents</h3>
                          {documentFolders.map(folder => {
                            const uniqueDocIds = new Set();
                            const folderDocs = documents.filter(doc => {
                              if (folder.categories.includes(doc.category)) {
                                uniqueDocIds.add(doc.documentId);
                                return true;
                              }
                              return false;
                            });
                            const uniqueDocCount = uniqueDocIds.size;

                            return (
                              <div key={folder.id} className="mb-3">
                                <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md mb-2">
                                  <div className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-primary" />
                                    <span className="font-medium text-sm">{folder.name}</span>
                                  </div>
                                  <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                                    {uniqueDocCount}
                                  </span>
                                </div>

                                {documentCategories
                                  .filter(category => folder.categories.includes(category.value))
                                  .map((category) => {
                                    const categoryDocIds = new Set();
                                    const categoryDocs = documents.filter(doc => doc.category === category.value);
                                    let docInCategory = null;
                                    if (categoryDocs.length > 0) {
                                      categoryDocs.forEach(doc => categoryDocIds.add(doc.documentId));
                                      docInCategory = categoryDocs[0];
                                    }
                                    let isVerified = false;
                                    if (docInCategory) {
                                      const allSignersForDoc = documents.filter(doc => doc.documentId === docInCategory!.documentId);
                                      isVerified = allSignersForDoc.length > 0 && allSignersForDoc.every(doc => doc.signed === "true");
                                    }
                                    const statusColor = isVerified ? "bg-green-500" : "bg-yellow-500";
                                    const canUploadThisCategory = userRoleCategories.includes(category.value);

                                    let categoryRowStyle = "bg-muted/40";
                                    let statusNode = null;

                                    if (docInCategory) {
                                      statusNode = (
                                        <div className="flex items-center">
                                          <div
                                            className={`w-2 h-2 rounded-full mr-1.5 ${statusColor}`}
                                            title={isVerified ? "Verified" : "Pending verification"}
                                          />
                                          <Button
                                            variant="ghost" size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleViewDocument(docInCategory.documentId); }}
                                            disabled={!!isViewingDoc || !!isDownloadingDoc}
                                            title="View" className="h-7 w-7"
                                          >
                                            {isViewingDoc === docInCategory.documentId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                                          </Button>
                                          <Button
                                            variant="ghost" size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleDownloadDocument(docInCategory.documentId); }}
                                            disabled={!!isViewingDoc || !!isDownloadingDoc}
                                            title="Download" className="h-7 w-7"
                                          >
                                            {isDownloadingDoc === docInCategory.documentId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                          </Button>
                                        </div>
                                      );
                                    } else {
                                      categoryRowStyle = "bg-muted/20 opacity-60";

                                      if (canUploadThisCategory) {
                                        statusNode = (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-primary hover:bg-primary/10"
                                            title={`Upload ${category.label}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenUploadModal(category.value);
                                            }}
                                          >
                                            <UploadCloud className="h-4 w-4" />
                                          </Button>
                                        );
                                      } else {
                                        statusNode = <span className="text-xs text-muted-foreground">No file</span>;
                                      }
                                    }

                                    return (
                                      <div key={category.value} className="mb-1 ml-2">
                                        <div className={`flex items-center justify-between p-1.5 ${categoryRowStyle} rounded-md text-sm`}>
                                          <div className="flex items-center">
                                            <FileText className="h-3 w-3 mr-1.5 text-primary/80" />
                                            <span>{category.label}</span>
                                          </div>
                                          {statusNode}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            );
                          })}
                        </div>

                        <div className="w-1/2 overflow-auto border rounded-md bg-card p-3 flex flex-col">
                          <div className="h-1/2 mb-3">
                            <h3 className="font-medium mb-2 text-sm">Document Preview</h3>
                            <div className="h-[calc(100%-2rem)] border rounded-lg overflow-hidden bg-background">
                              {isDecrypting ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                  <p className="text-muted-foreground">Decrypting document...</p>
                                </div>
                              ) : viewerDocuments.length > 0 ? (
                                <DocViewer
                                  documents={viewerDocuments}
                                  pluginRenderers={DocViewerRenderers}
                                  config={{
                                    header: {
                                      disableHeader: false,
                                      disableFileName: false,
                                      retainURLParams: false
                                    }
                                  }}
                                  style={{ height: '100%' }}
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg p-6">
                                  <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                                  <p className="text-center text-muted-foreground">
                                    Select a document to preview its contents here.
                                  </p>
                                  <p className="text-center text-muted-foreground text-sm mt-2">
                                    Supported formats include PDF, DOCX, PPTX, and more.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="h-1/2">
                            <h3 className="font-medium mb-2 text-sm">Document Details</h3>
                            <div className="h-[calc(100%-2rem)] border rounded-lg overflow-auto bg-background p-3">
                              {selectedDocument ? (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-sm">{selectedDocument.originalFilename}</h4>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(selectedDocument.uploadedAt), 'PP')}
                                    </span>
                                  </div>

                                  <div>
                                    <h5 className="text-xs font-medium mb-2">Signatures</h5>
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
                                                    onClick={(e) => { e.stopPropagation(); handleSignDocument(selectedDocument.documentId); }}
                                                    disabled={isSigningDoc !== null}
                                                      title="E-Sign this document"
                                                  >
                                                    {isSigningDoc === selectedDocument.documentId ? (
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
                                      Note: Signatures are generated using the user's private Arweave key via the Wallet Kit. Each signature is cryptographically linked to the document identifier and can be verified against the signer's public key (Arweave address).
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                  <p className="text-sm">Select a document to view details</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-1/2 overflow-auto border rounded-md bg-card p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Documents Pending Signature</h3>
                        <Dialog
                          open={isUploadModalOpen}
                          onOpenChange={(isOpen) => {
                            setIsUploadModalOpen(isOpen);
                            if (!isOpen) {
                              setPreselectedCategory(null);
                              setSelectedFile(null);
                              setFileError(null);
                              if (uploadFormRef.current) uploadFormRef.current.reset();
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setPreselectedCategory(null)} disabled={!roomPublicKey}>
                              <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                              <DialogTitle>Upload New Document</DialogTitle>
                              <DialogDescription>
                                Select a file to encrypt and upload securely using the room's key.
                              </DialogDescription>
                            </DialogHeader>
                            <form ref={uploadFormRef} action={uploadFormAction}>
                              <input type="hidden" name="roomId" value={roomId} />
                              <input type="hidden" name="uploaderEmail" value={currentUserEmail || ""} />
                              <input type="hidden" name="role" value={currentUserRole || ""} />
                              <input type="hidden" name="roomPubKey" value={roomPublicKey || ""} />
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="documentFile" className="text-right">File <span className="text-destructive">*</span></Label>
                                  <Input id="documentFile" name="documentFile" type="file" className="col-span-3" onChange={handleFileChange} required />
                                </div>
                                {fileError && <p className="col-span-4 text-sm text-destructive text-center">{fileError}</p>}
                                {selectedFile && <p className="col-span-4 text-sm text-muted-foreground text-center">Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="category" className="text-right">Category <span className="text-destructive">*</span></Label>
                                  <Select name="category" required key={preselectedCategory} defaultValue={preselectedCategory ?? undefined}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                    <SelectContent>
                                      {filteredUploadCategories.length > 0 ? (
                                        filteredUploadCategories.map(cat => (
                                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                        ))
                                      ) : (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available for your role.</div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {uploadState && !uploadState.success && (
                                <p className="text-sm text-destructive text-center pb-4">
                                  Error: {uploadState.message} {uploadState.error ? `(${uploadState.error})` : ''}
                                </p>
                              )}
                              {!roomPublicKey && (
                                    <p className="text-sm text-destructive text-center pb-4">
                                        Error: Cannot upload - Room Public Key is missing.
                                    </p>
                                )}
                              <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <UploadSubmitButton />
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="space-y-6">
                        {(() => {
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
                            const categoryInfo = documentCategories.find(cat => cat.value === doc.category);
                            const overallStatusColor = "bg-yellow-500";
                            const overallStatusText = "Pending";

                            return (
                              <div key={doc.documentId} className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h4 className="font-medium flex items-center text-lg">
                                      <div className={`w-3 h-3 rounded-full ${overallStatusColor} mr-2`} title={overallStatusText} />
                                      {categoryInfo?.label || doc.category}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">{doc.originalFilename}</p>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline" size="sm"
                                      onClick={(e) => { e.stopPropagation(); handleViewDocument(doc.documentId); }}
                                      disabled={!!isViewingDoc || !!isDownloadingDoc}
                                      className="flex items-center"
                                    >
                                      {isViewingDoc === doc.documentId ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />} View
                                    </Button>
                                    <Button
                                      variant="outline" size="sm"
                                      onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc.documentId); }}
                                      disabled={!!isViewingDoc || !!isDownloadingDoc}
                                      className="flex items-center"
                                    >
                                      {isDownloadingDoc === doc.documentId ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />} Download
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-4 border rounded-md overflow-hidden">
                                  <div className="bg-muted/30 p-3 flex justify-between items-center">
                                    <h5 className="font-medium text-sm">Signers</h5>
                                    <div className="flex items-center">
                                      <div className={`w-2.5 h-2.5 rounded-full ${overallStatusColor} mr-2`} />
                                      <span className="text-sm">{overallStatusText}</span>
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
                                                  onClick={(e) => { e.stopPropagation(); handleSignDocument(doc.documentId); }}
                                                  disabled={isSigningDoc !== null}
                                                >
                                                  {isSigningDoc === doc.documentId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-current" />
                                                  ) : (
                                                    'E-Sign'
                                                  )}
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
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Room Members</h2>
                    <p className="text-sm text-muted-foreground">Manage who has access to this room.</p>
                  </div>
                  {canAddAnyMember && (
                    <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <UserPlus className="mr-2 h-4 w-4" /> Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Member</DialogTitle>
                          <DialogDescription>
                            Enter the email address and assign a role.
                          </DialogDescription>
                        </DialogHeader>

                        <form ref={addMemberFormRef} action={addMemberFormAction}>
                          <input type="hidden" name="roomId" value={roomId} />
                          <input type="hidden" name="callerEmail" value={currentUserEmail || ""} />
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="newUserEmail" className="text-right">Email</Label>
                              <Input id="newUserEmail" name="newUserEmail" type="email" required className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="newUserRole" className="text-right">Role</Label>
                              <Select name="newUserRole" required>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select a role to add" />
                                </SelectTrigger>
                                <SelectContent>
                                  {canAddCFO && <SelectItem value="cfo">CFO</SelectItem>}
                                  {canAddInvestor && <SelectItem value="investor">Investor</SelectItem>}
                                  {canAddAuditor && <SelectItem value="auditor">Auditor</SelectItem>}
                                  {canAddCustomer && <SelectItem value="customer">Customer</SelectItem>}
                                  {canAddVendor && <SelectItem value="vendor">Vendor</SelectItem>}
                                  {!canAddAnyMember && (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">You don&apos;t have permission to add members.</div>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <AddMemberSubmitButton />
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="flex-1 overflow-auto border rounded-md bg-card p-4">
                  <ul className="space-y-2">
                    {roomDetails.members.map((member) => (
                      <li key={member.userEmail} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{member.userEmail} {member.userEmail === currentUserEmail ? '(You)' : ''}</p>
                          <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                        </div>
                        {canManageMembers && member.role !== 'founder' && (
                          <form action={removeMemberFormAction}>
                            <input type="hidden" name="roomId" value={roomId} />
                            <input type="hidden" name="callerEmail" value={currentUserEmail || ""} />
                            <input type="hidden" name="userToRemoveEmail" value={member.userEmail} />
                            <RemoveMemberSubmitButton email={member.userEmail} />
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                  {removeMemberState && !removeMemberState.success && (
                    <p className="text-sm text-destructive text-center pt-4">
                      Error removing member: {removeMemberState.message} {removeMemberState.error ? `(${removeMemberState.error})` : ''}
                    </p>
                  )}
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
      </div>
    </RequireLogin>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64String: string) {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}