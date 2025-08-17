import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { UploadCloud, Eye, Download, Loader2, Plus, X, Check, Trash2, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { type DocumentInfo, type RoomDetails } from "../../types/types";
import { useState } from "react";
import { addRolePermissionClientAction, deleteRoleClientAction } from "../../services/roomActionsClient";
import { toast } from "sonner";

interface AllDocumentsPaneProps {
  roomDetails: RoomDetails;
  documents: DocumentInfo[];
  allowedUploadCategories: string[];
  isViewingDoc: string | null;
  isDownloadingDoc: string | null;
  currentUserEmail: string | null;
  currentUserRole: string | null;
  stateUpdater: any;
  onViewDocument: (documentId: string) => void;
  onDownloadDocument: (documentId: string) => void;
  onOpenUploadModal: (category: string) => void;
}

export default function AllDocumentsPane({
  roomDetails,
  documents,
  allowedUploadCategories,
  isViewingDoc,
  isDownloadingDoc,
  currentUserEmail,
  currentUserRole,
  stateUpdater,
  onViewDocument,
  onDownloadDocument,
  onOpenUploadModal
}: AllDocumentsPaneProps) {
  const [addingPermissionToRole, setAddingPermissionToRole] = useState<string | null>(null);
  const [newPermissionInput, setNewPermissionInput] = useState("");
  const [isSubmittingPermission, setIsSubmittingPermission] = useState(false);
  
  // Modal state for role deletion
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const isFounder = currentUserRole === 'founder';

  const sortedRoles = [...roomDetails.roomRoles]
    .filter(role => role.documentTypes.length > 0)
    .sort((a, b) => {
      if (a.roleName === 'founder') return -1;
      if (b.roleName === 'founder') return 1;
      return a.roleName.localeCompare(b.roleName);
    });

  const defaultOpenRoles = sortedRoles.map(role => role.roleName);

  const handleAddPermission = (roleName: string) => {
    setAddingPermissionToRole(roleName);
    setNewPermissionInput("");
    
    // Auto-open the role accordion if it's closed
    const accordionTrigger = document.querySelector(`[data-role="${roleName}"] button[data-state="closed"]`);
    if (accordionTrigger) {
      (accordionTrigger as HTMLElement).click();
    }
  };

  const handleCancelAddPermission = () => {
    setAddingPermissionToRole(null);
    setNewPermissionInput("");
  };

  const handleSavePermission = async (roleName: string) => {
    if (!newPermissionInput.trim() || !currentUserEmail || !isFounder) return;

    const permissionToAdd = newPermissionInput.trim();

    // Check for duplicate permissions across ALL roles
    const existingRole = roomDetails.roomRoles.find(r => 
      r.documentTypes.includes(permissionToAdd)
    );
    
    if (existingRole) {
      toast.error("Duplicate Permission", { 
        description: `The "${permissionToAdd}" permission already exists in the "${existingRole.roleName}" role. Document categories must be unique across all roles.` 
      });
      return;
    }

    setIsSubmittingPermission(true);
    try {
      const result = await addRolePermissionClientAction({
        roomId: roomDetails.roomId,
        callerEmail: currentUserEmail,
        roleName: roleName,
        documentType: permissionToAdd
      });

      if (result.success) {
        // Clear the input and hide the form IMMEDIATELY after success
        handleCancelAddPermission();
        
        toast.success("Permission Added", { 
          description: `Successfully added "${permissionToAdd}" to ${roleName} role.` 
        });
        
        // Update local state immediately (same as RoleManager)
        const role = roomDetails.roomRoles.find(r => r.roleName === roleName);
        if (role) {
          const updatedDocTypes = [...role.documentTypes, permissionToAdd];
          stateUpdater.updateRolePermissions(roleName, updatedDocTypes);
        }
        
        // Add log entry for the activity
        stateUpdater.addLog(currentUserEmail!, `Gave the '${roleName}' role permission to upload '${permissionToAdd}' documents.`);
      } else {
        toast.error("Failed to Add Permission", { 
          description: result.error || result.message || "Could not add permission to role." 
        });
      }
    } catch (error: any) {
      console.error("Error adding role permission:", error);
      toast.error("Error Adding Permission", { 
        description: error.message || "An unexpected error occurred." 
      });
    } finally {
      setIsSubmittingPermission(false);
    }
  };

  const handleDeleteRoleClick = (roleName: string) => {
    if (!currentUserEmail || !isFounder || roleName === 'founder') return;
    
    setRoleToDelete(roleName);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete || !currentUserEmail || !isFounder) return;

    setIsDeletingRole(true);
    try {
      const result = await deleteRoleClientAction({
        roomId: roomDetails.roomId,
        callerEmail: currentUserEmail,
        roleNameToDelete: roleToDelete
      });

      if (result.success) {
        toast.success("Role Deleted", { 
          description: `Successfully deleted the "${roleToDelete}" role.` 
        });
        
        // Update state using stateUpdater
        stateUpdater.removeRole(roleToDelete);
        stateUpdater.addLog(currentUserEmail!, `Deleted the role '${roleToDelete}'.`);
      } else {
        toast.error("Failed to Delete Role", { 
          description: result.error || result.message || "Could not delete role." 
        });
      }
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast.error("Error Deleting Role", { 
        description: error.message || "An unexpected error occurred." 
      });
    } finally {
      setIsDeletingRole(false);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  return (
    <>
      <div className="w-1/2 border-r p-3 overflow-y-auto">
        <h3 className="font-medium mb-3 text-sm">All Documents</h3>
        <Accordion type="multiple" defaultValue={defaultOpenRoles} className="w-full">
          {sortedRoles.map(role => (
            <AccordionItem value={role.roleName} key={role.roleName} className="border-b-0" data-role={role.roleName}>
              <AccordionTrigger className="text-sm font-medium capitalize hover:no-underline px-2 py-1.5 rounded-md bg-muted/80 hover:bg-muted transition-colors group [&[data-state=open]>div>div>svg]:rotate-90 [&>svg]:hidden">
                <div className="flex items-center justify-between w-full mr-2">
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground mr-2 transition-transform duration-200" />
                    <span>{role.roleName.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    {isFounder && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddPermission(role.roleName);
                          }}
                          title={`Add document type to ${role.roleName}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        {role.roleName !== 'founder' && role.isDeletable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoleClick(role.roleName);
                            }}
                            title={`Delete ${role.roleName} role`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0 pl-3">
                <div className="space-y-1 py-1">
                  <Accordion type="multiple" className="w-full">
                    {role.documentTypes.map(docType => {
                      const docsInCategory = documents.filter(doc => doc.category === docType);
                      const hasDocuments = docsInCategory.length > 0;
                      
                      // Get unique documents (by documentId) and sort by upload date
                      const uniqueDocuments = docsInCategory
                        .reduce((acc: DocumentInfo[], doc) => {
                          if (!acc.find(d => d.documentId === doc.documentId)) {
                            acc.push(doc);
                          }
                          return acc;
                        }, [])
                        .sort((a, b) => b.uploadedAt - a.uploadedAt);

                      return (
                        <AccordionItem value={docType} key={docType} className="border-b-0 mb-2">
                          {hasDocuments ? (
                            <AccordionTrigger className="flex items-center justify-between pl-2 pr-1 py-1.1 rounded-md transition-colors duration-150 hover:bg-accent text-sm font-normal capitalize hover:no-underline w-full group [&>svg]:hidden">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <span className="text-foreground">
                                    {docType.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <div className="ml-2 flex items-center">
                                  {/* Show overall status for the category */}
                                  {(() => {
                                    const allDocsVerified = uniqueDocuments.every(doc => {
                                      const allSignersForDoc = documents.filter(d => d.documentId === doc.documentId);
                                      return allSignersForDoc.length > 0 && allSignersForDoc.every(d => d.signed === "true");
                                    });
                                    return allDocsVerified ? (
                                      <div title="All documents verified">
                                        <Check className="h-3 w-3 text-green-600 mr-1.5" />
                                      </div>
                                    ) : (
                                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" title="Some documents pending verification" />
                                    );
                                  })()}
                                  <div className="pr-1">
                                    <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                          ) : (
                            <div className="flex items-center justify-between pl-2 pr-1 py-1.1 rounded-md transition-colors duration-150 hover:bg-accent">
                              <div className="flex-1 text-sm font-normal capitalize">
                                <span className="text-muted-foreground/80">
                                  {docType.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="ml-2">
                                {allowedUploadCategories.includes(docType) ? (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-primary/70 hover:bg-primary/10 hover:text-primary" 
                                    title={`Upload ${docType.replace(/_/g, ' ')}`} 
                                    onClick={() => onOpenUploadModal(docType)}
                                  >
                                    <UploadCloud className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <div className="h-7 w-7" />
                                )}
                              </div>
                            </div>
                          )}
                          
                          {hasDocuments && (
                            <AccordionContent className="pt-1 pb-0 pl-4">
                              <div className="space-y-1">
                                {uniqueDocuments.map(doc => {
                                  const allSignersForDoc = documents.filter(d => d.documentId === doc.documentId);
                                  const isVerified = allSignersForDoc.length > 0 && allSignersForDoc.every(d => d.signed === "true");
                                  
                                  return (
                                    <div key={doc.documentId} className="flex items-center justify-between pl-2 pr-1 py-1 rounded-md transition-colors duration-150 hover:bg-accent/50">
                                      <div className="flex items-center flex-1 min-w-0">
                                        <FileText className="h-3 w-3 text-muted-foreground mr-2 flex-shrink-0" />
                                        <span className="text-xs text-foreground truncate" title={doc.originalFilename}>
                                          {doc.originalFilename || `Document ${doc.documentId.slice(0, 8)}`}
                                        </span>
                                      </div>
                                      <div className="flex items-center ml-2">
                                        {isVerified ? (
                                          <div title="Verified">
                                            <Check className="h-3 w-3 text-green-600 mr-1.5" />
                                          </div>
                                        ) : (
                                          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" title="Pending verification" />
                                        )}
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => onViewDocument(doc.documentId)} 
                                          disabled={!!isViewingDoc || !!isDownloadingDoc} 
                                          title="View" 
                                          className="h-6 w-6"
                                        >
                                          {isViewingDoc === doc.documentId ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Eye className="h-2.5 w-2.5" />}
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => onDownloadDocument(doc.documentId)} 
                                          disabled={!!isViewingDoc || !!isDownloadingDoc} 
                                          title="Download" 
                                          className="h-6 w-6"
                                        >
                                          {isDownloadingDoc === doc.documentId ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Download className="h-2.5 w-2.5" />}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {/* Upload button inside the category if user can upload */}
                                {allowedUploadCategories.includes(docType) && (
                                  <div className="flex items-center justify-between pl-2 pr-1 py-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-6 text-xs text-primary/70 hover:text-primary border-dashed" 
                                      onClick={() => onOpenUploadModal(docType)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Document
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          )}
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                  
                  {/* Add Permission Input Field */}
                  {isFounder && addingPermissionToRole === role.roleName && (
                    <div className="flex items-center gap-2 pl-2 pr-1 py-1">
                      <Input
                        value={newPermissionInput}
                        onChange={(e) => setNewPermissionInput(e.target.value)}
                        placeholder="Enter document type name"
                        className="h-7 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSavePermission(role.roleName);
                          } else if (e.key === 'Escape') {
                            handleCancelAddPermission();
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-green-700"
                        onClick={() => handleSavePermission(role.roleName)}
                        disabled={!newPermissionInput.trim() || isSubmittingPermission}
                      >
                        {isSubmittingPermission ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={handleCancelAddPermission}
                        disabled={isSubmittingPermission}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Role Deletion Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role: "{roleToDelete}"?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
            <p><span className="font-semibold">Note:</span> All users with this role will be reassigned to the default 'member' role.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeletingRole}>Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDeleteRole} disabled={isDeletingRole}>
              {isDeletingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 