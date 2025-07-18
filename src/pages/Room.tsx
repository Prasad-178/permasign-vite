/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import RequireLogin from "../components/RequireLogin";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { MessageSquare, RefreshCw, AlertTriangle, Terminal } from "lucide-react";
import { toast } from "sonner";
import { CustomLoader } from "../components/ui/CustomLoader";
import { useApi, useActiveAddress } from '@arweave-wallet-kit/react';
import { useActionState } from "react";
import { useConnection } from "@arweave-wallet-kit/react";
import { type RoomDetails, type DocumentInfo, type ModifyMemberResult, type UploadDocumentResult, type RoomDocument, type GetRoomDetailsResult } from "../types/types";
import DocumentSigningModal from "./components/DocumentSigningModal";
import DocumentTimeline from "./components/DocumentTimeline";
import RoleManager from "./components/RoleManager";
import MemberManager from "./components/MemberManager";
import DocumentViewModal from "./components/DocumentViewModal";
import DocumentsTab from "./components/DocumentsTab";
import ChatSidebar from "./components/ChatSidebar";
import RoomHeader from "./components/RoomHeader";
import AddSignerModal from "./components/AddSignerModal";
import { useDocumentOperations } from "../hooks/useDocumentOperations";
import { useSignerManagement } from "../hooks/useSignerManagement";
import { useModalManagement } from "../hooks/useModalManagement";
import {
  addMemberFormAdapter,
  removeMemberFormAdapter,
  getRoomDetailsAction,
  uploadDocumentFormAdapter,
} from '../services/roomActionsClient';
import { useRoomStateUpdater } from "../utils/roomStateUpdater";

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
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

  // Prevent page-level scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
  const [categoryInput, setCategoryInput] = useState("");
  const [isCategorySuggestionsOpen, setIsCategorySuggestionsOpen] = useState(false);

  const objectUrlsRef = useRef<string[]>([]);
  if (objectUrlsRef) {

  }

  const [isTemplatesSidebarOpen, setIsTemplatesSidebarOpen] = useState(false);

  useEffect(() => {
    if (roomDetails) {
      document.title = `PermaSign | ${roomDetails.roomName}`;
    } else {
      document.title = "PermaSign | Loading Company...";
    }
  }, [roomDetails]);



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

  // Removed automatic initial document loading as per user request

  // Initialize state updater for selective updates
  const stateUpdater = useRoomStateUpdater(roomDetails, setRoomDetails, documents, setDocuments, currentUserEmail);

  const currentUserRole = roomDetails?.members.find(m => m.userEmail === currentUserEmail)?.role;

  // Use document operations hook
  const {
    isViewingDoc,
    isDownloadingDoc,
    isSigningDoc,
    setIsViewingDoc,
    getDecryptedRoomKey,
    retrieveAndDecrypt,
    handleDownloadDocument,
    handleSignDocument
  } = useDocumentOperations({
    roomDetails,
    documents,
    currentUserEmail,
    currentUserRole,
    stateUpdater
  });

  // Auto-load first document and cache others in background
  useEffect(() => {
    const autoLoadFirstDocument = async () => {
      if (!documents.length || !currentUserEmail || selectedDocument) return;
      
      // Find the first document to display
      const firstDocument = documents.find(doc => doc.originalFilename) || documents[0];
      if (!firstDocument) return;

      console.log("Auto-loading first document for preview:", firstDocument.documentId);
      
      // Load the first document into preview
      try {
        const decryptedKey = await getDecryptedRoomKey();
        if (!decryptedKey) return;

        setIsDecrypting(true);
        setSelectedDocument(firstDocument);
        setViewerDocuments([]);

        const result = await retrieveAndDecrypt(firstDocument, decryptedKey);
        
        if (result.success && result.data) {
          const dataUri = `data:${result.data.contentType};base64,${result.data.decryptedData}`;
          setViewerDocuments([{
            uri: dataUri,
            fileName: result.data.filename,
            fileType: result.data.contentType
          }]);
          console.log("First document loaded successfully");
        }
      } catch (error: any) {
        console.error("Error auto-loading first document:", error);
      } finally {
        setIsDecrypting(false);
      }

      // Background cache other documents (max 3 more to avoid overwhelming)
      const otherDocuments = documents
        .filter(doc => doc.documentId !== firstDocument.documentId)
        .slice(0, 3);
      
      if (otherDocuments.length > 0) {
        console.log(`Starting background caching for ${otherDocuments.length} documents`);
        
        // Cache other documents in background with delay
        setTimeout(async () => {
          try {
            const decryptedKey = await getDecryptedRoomKey();
            if (!decryptedKey) return;

            for (const doc of otherDocuments) {
              try {
                // Add small delay between requests to avoid overwhelming
                await new Promise(resolve => setTimeout(resolve, 500));
                await retrieveAndDecrypt(doc, decryptedKey);
                console.log(`Background cached document: ${doc.documentId}`);
              } catch (error) {
                console.warn(`Failed to cache document ${doc.documentId}:`, error);
              }
            }
            console.log("Background caching completed");
          } catch (error) {
            console.error("Error during background caching:", error);
          }
        }, 1000); // Start caching after 1 second delay
      }
    };

    // Only auto-load if we have documents and no document is currently selected
    if (documents.length > 0 && !selectedDocument && !isLoadingDetails) {
      autoLoadFirstDocument();
    }
  }, [documents, currentUserEmail, selectedDocument, isLoadingDetails, getDecryptedRoomKey, retrieveAndDecrypt]);

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
        // Refresh logs to show the upload activity
        stateUpdater.refreshLogs();
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

  // Use signer management hook
  const {
    signers,
    setSigners,
    signerInput,
    setSignerInput,
    isSignerSuggestionsOpen,
    setIsSignerSuggestionsOpen,
    isAddSignerModalOpen,
    setIsAddSignerModalOpen,
    addSignerDocDetails,
    setAddSignerDocDetails,
    newSignerEmail,
    setNewSignerEmail,
    isSubmittingSigner,
    isRemovingSigner,
    handleAddSigner,
    handleRemoveSigner,
    handleOpenAddSignerModal,
    handleAddSignerToDocument,
    handleRemoveSignerFromDocument,
    initializeSigners
  } = useSignerManagement({
    roomId,
    currentUserEmail,
    currentUserRole,
    roomDetails,
    documents,
    stateUpdater
  });

  // Use modal management hook
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    selectedFile,
    setSelectedFile,
    fileError,
    setFileError,
    preselectedCategory,
    setPreselectedCategory,
    isSigningModalOpen,
    signingDocumentId,
    signingDocumentData,
    signingDocumentName,
    signingDocumentType,
    isViewModalOpen,
    viewModalDocData,
    isPreparingView,
    handleOpenUploadModal,
    handleFileChange,
    openSigningModal,
    closeSigningModal,
    handleOpenViewModal,
    closeViewModal
  } = useModalManagement({
    documents,
    getDecryptedRoomKey,
    retrieveAndDecrypt
  });

  // const isFounder = currentUserRole === 'founder';
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
    if (isUploadModalOpen) {
      initializeSigners();
    }
  }, [isUploadModalOpen, initializeSigners]);



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
      }
      if (!target.closest('.category-input-container')) {
        if (isCategorySuggestionsOpen) {
          setIsCategorySuggestionsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSignerSuggestionsOpen, isCategorySuggestionsOpen]);







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
  // const currentUserRoleDetails = roomDetails.roomRoles.find(r => r.roleName === currentUserRole);
  // const allowedUploadCategories = currentUserRoleDetails ? currentUserRoleDetails.documentTypes : [];

  // const sortedRoles = [...roomDetails.roomRoles]
    // .filter(role => role.documentTypes.length > 0)
    // .sort((a, b) => {
    //   if (a.roleName === 'founder') return -1;
    //   if (b.roleName === 'founder') return 1;
    //   return a.roleName.localeCompare(b.roleName);
    // });

  // const defaultOpenRoles = sortedRoles.map(role => role.roleName);

  return (
    <RequireLogin>
      <div className="flex flex-col h-screen -mt-12 relative overflow-hidden">
        <RoomHeader 
          roomDetails={roomDetails}
          currentUserEmail={currentUserEmail}
          currentUserRole={currentUserRole}
          isTemplatesSidebarOpen={isTemplatesSidebarOpen}
          onTemplatesSidebarChange={setIsTemplatesSidebarOpen}
        />

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="documents" className="h-full flex flex-col">
            <div className="flex justify-center">
              <TabsList className="mt-1">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="members">Members ({roomDetails.members.length})</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden px-4 pb-2">
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
                  categoryInput={categoryInput}
                  isCategorySuggestionsOpen={isCategorySuggestionsOpen}
                  preselectedCategory={preselectedCategory}
                  uploadFormRef={uploadFormRef as React.RefObject<HTMLFormElement>}
                  uploadState={uploadState}
                  isSigningDoc={isSigningDoc}
                  isSigningModalOpen={isSigningModalOpen}
                  isAddSignerModalOpen={isAddSignerModalOpen}
                  addSignerDocDetails={addSignerDocDetails}
                  newSignerEmail={newSignerEmail}
                  isSubmittingSigner={isSubmittingSigner}
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
                  onSetCategoryInput={setCategoryInput}
                  onSetIsCategorySuggestionsOpen={setIsCategorySuggestionsOpen}
                  onSetPreselectedCategory={setPreselectedCategory}
                  onSetIsAddSignerModalOpen={setIsAddSignerModalOpen}
                  onSetNewSignerEmail={setNewSignerEmail}
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
                  // fetchRoomDetails={fetchRoomDetails}
                  stateUpdater={stateUpdater}
                />
              </TabsContent>

              <TabsContent value="settings" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <div className="flex-1 overflow-auto">
                      <RoleManager
                          roomDetails={roomDetails}
                          currentUserEmail={currentUserEmail}
                          // fetchRoomDetails={fetchRoomDetails}
                          stateUpdater={stateUpdater}
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
        

        <ChatSidebar 
          isOpen={isChatSidebarOpen}
          onOpenChange={setIsChatSidebarOpen}
        />

        <DocumentSigningModal
          isOpen={isSigningModalOpen}
          onClose={closeSigningModal}
          documentId={signingDocumentId || ""}
          documentName={signingDocumentName}
          documentData={signingDocumentData || undefined}
          contentType={signingDocumentType}
          isSigning={isSigningDoc === signingDocumentId}
          onSign={handleSignDocument}
        />

        <DocumentViewModal
            isOpen={isViewModalOpen}
            onClose={closeViewModal}
            documentName={selectedDocument?.originalFilename || ""}
            documentData={viewModalDocData || undefined}
            contentType={selectedDocument?.contentType || ""}
            isLoading={isPreparingView}
        />

        <AddSignerModal
          isOpen={isAddSignerModalOpen}
          onOpenChange={setIsAddSignerModalOpen}
          roomDetails={roomDetails}
          addSignerDocDetails={addSignerDocDetails}
          newSignerEmail={newSignerEmail}
          setNewSignerEmail={setNewSignerEmail}
          isSubmittingSigner={isSubmittingSigner}
          onAddSignerToDocument={handleAddSignerToDocument}
          onSetAddSignerDocDetails={setAddSignerDocDetails}
        />
      </div>
    </RequireLogin>
  );
}


