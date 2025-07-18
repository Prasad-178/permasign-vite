/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { type RoomDetails, type ModifyRoleResult, type RoomRoles } from "../../types/types";
import { type RoomStateUpdater } from "../../utils/roomStateUpdater";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "../../components/ui/dialog";
import { PlusCircle, Shield, AlertTriangle, Crown, User, Loader2, Settings, X, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { addRoleFormAdapter, deleteRoleClientAction, addRolePermissionClientAction, removeRolePermissionClientAction } from "../../services/roomActionsClient";
import AddRoleSubmitButton from "./AddRoleSubmitButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge as UiBadge } from "../../components/ui/badge";

interface RoleManagerProps {
  roomDetails: RoomDetails;
  currentUserEmail: string | null;
  // fetchRoomDetails: () => void;
  stateUpdater: RoomStateUpdater;
}

const getRoleIcon = (roleName: string) => {
    if (roleName === 'founder') return <Crown className="mr-2 h-4 w-4 text-yellow-500" />;
    if (roleName === 'member') return <User className="mr-2 h-4 w-4 text-muted-foreground" />;
    return <Shield className="mr-2 h-4 w-4 text-muted-foreground" />;
};

export default function RoleManager({ roomDetails, currentUserEmail, stateUpdater }: RoleManagerProps) {
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const addRoleFormRef = useRef<HTMLFormElement>(null);

  // --- State for the new settings modal ---
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoomRoles | null>(null);
  const [newDocType, setNewDocType] = useState("");
  const [isPermissionActionLoading, setIsPermissionActionLoading] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const [addRoleState, addRoleFormAction] = useActionState<ModifyRoleResult | null, FormData>(addRoleFormAdapter, null);

  useEffect(() => {
    if (addRoleState) {
      if (addRoleState.success) {
        toast.success("Role Action Successful", { description: addRoleState.message });
        setIsAddRoleModalOpen(false);
        addRoleFormRef.current?.reset();
        // Add the new role to local state
        if (newRoleName.trim()) {
          const newRole: RoomRoles = {
            roleName: newRoleName.trim(),
            documentTypes: [],
            isDeletable: true
          };
          stateUpdater.addRole(newRole);
          setNewRoleName("");
          // Refresh logs to show the activity
          stateUpdater.refreshLogs();
        }
      } else {
        toast.error("Failed to Add Role", { description: addRoleState.error || addRoleState.message });
      }
    }
  }, [addRoleState, newRoleName, stateUpdater]);

  const handleAddDocType = async () => {
    if (!selectedRole || !newDocType.trim() || !currentUserEmail) return;

    // Check for duplicate permissions
    if (selectedRole.documentTypes.includes(newDocType.trim())) {
      toast.error("Duplicate Permission", { 
        description: `The "${newDocType.trim()}" permission already exists for the ${selectedRole.roleName} role.` 
      });
      return;
    }

    setIsPermissionActionLoading(true);
    const result = await addRolePermissionClientAction({
      roomId: roomDetails.roomId,
      callerEmail: currentUserEmail,
      roleName: selectedRole.roleName,
      documentType: newDocType.trim(),
    });

    if (result.success) {
      toast.success("Permission Added", { description: `Document type "${newDocType.trim()}" added to ${selectedRole.roleName}.` });
      setNewDocType("");
      // Update local state instead of full refresh
      const updatedDocTypes = [...selectedRole.documentTypes, newDocType.trim()];
      stateUpdater.updateRolePermissions(selectedRole.roleName, updatedDocTypes);
      // Update the selected role for the modal
      setSelectedRole({...selectedRole, documentTypes: updatedDocTypes});
      // Refresh logs to show the activity
      stateUpdater.refreshLogs();
    } else {
      toast.error("Failed to Add Permission", { description: result.error || "An unknown error occurred." });
    }
    setIsPermissionActionLoading(false);
  };

  const handleRemoveDocType = async (docType: string) => {
    if (!selectedRole || !currentUserEmail) return;

    // Check if there are any documents of this type
    const documentsOfType = roomDetails.documentDetails?.filter(doc => doc.category === docType) || [];
    if (documentsOfType.length > 0) {
      toast.error("Cannot Delete Permission", { 
        description: `Cannot remove "${docType}" permission because ${documentsOfType.length} document(s) of this type exist. Please delete the documents first.` 
      });
      return;
    }

    setIsPermissionActionLoading(true);
    const result = await removeRolePermissionClientAction({
      roomId: roomDetails.roomId,
      callerEmail: currentUserEmail,
      roleName: selectedRole.roleName,
      documentType: docType,
    });
    if (result.success) {
      toast.success("Permission Removed", { description: `Document type "${docType}" removed from ${selectedRole.roleName}.` });
      // Update local state instead of full refresh
      const updatedDocTypes = selectedRole.documentTypes.filter(dt => dt !== docType);
      stateUpdater.updateRolePermissions(selectedRole.roleName, updatedDocTypes);
      // Update the selected role for the modal
      setSelectedRole({...selectedRole, documentTypes: updatedDocTypes});
      // Refresh logs to show the activity
      stateUpdater.refreshLogs();
    } else {
      toast.error("Failed to Remove Permission", { description: result.error || "An unknown error occurred." });
    }
    setIsPermissionActionLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete || !currentUserEmail) {
      toast.error("An error occurred", { description: "Role or user details are missing." });
      return;
    }
    
    setIsDeleting(true);

    try {
      const result = await deleteRoleClientAction({
        roomId: roomDetails.roomId,
        callerEmail: currentUserEmail,
        roleNameToDelete: roleToDelete,
      });

      if (result.success) {
        toast.success("Role Deleted", { description: result.message || `Role "${roleToDelete}" has been deleted.` });
        // Update local state instead of full refresh
        stateUpdater.removeRole(roleToDelete);
        // Refresh logs to show the activity
        stateUpdater.refreshLogs();
      } else {
        toast.error("Failed to Delete Role", { description: result.error || result.message || "An unknown error occurred." });
      }
    } catch (error: any) {
      toast.error("Failed to Delete Role", { description: error.message || "A network error occurred." });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };
  
  const sortedRoles = [...(roomDetails.roomRoles || [])].sort((a, b) => {
    if (a.roleName === 'founder') return -1;
    if (b.roleName === 'founder') return 1;
    if (a.roleName === 'member') return 1;
    if (b.roleName === 'member') return -1;
    return a.roleName.localeCompare(b.roleName);
  });

  const canManageRoles = roomDetails.members.find(m => m.userEmail === currentUserEmail)?.role === 'founder';

  if (!canManageRoles) {
      return (
          <Card className="mt-4 border-dashed border-yellow-500/50 bg-yellow-500/5">
              <CardHeader>
                  <CardTitle className="flex items-center text-yellow-600">
                      <AlertTriangle className="mr-2" />
                      Permission Denied
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">You do not have permission to manage roles in this room. This functionality is restricted to the room founder.</p>
              </CardContent>
          </Card>
      );
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
            <p className="text-muted-foreground">Add new roles or configure permissions for existing ones.</p>
        </div>
        <Dialog open={isAddRoleModalOpen} onOpenChange={(open) => {
          setIsAddRoleModalOpen(open);
          if (!open) {
            setNewRoleName("");
            addRoleFormRef.current?.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>
                Create a new custom role.
              </DialogDescription>
            </DialogHeader>
            <form ref={addRoleFormRef} action={addRoleFormAction}>
              <input type="hidden" name="roomId" value={roomDetails.roomId} />
              <input type="hidden" name="callerEmail" value={currentUserEmail || ""} />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newRoleName" className="text-right">Role Name</Label>
                  <Input 
                  id="newRoleName" 
                  name="newRoleName" 
                  type="text" 
                  title="Role name" 
                  required 
                  className="col-span-3" 
                  placeholder="e.g. Legal Team"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
                </div>
              </div>
              {addRoleState && !addRoleState.success && (
                <p className="text-sm text-destructive text-center pb-4">
                    Error: {addRoleState.message} {addRoleState.error ? `(${addRoleState.error})` : ''}
                </p>
              )}
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <AddRoleSubmitButton />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedRoles.map(role => (
          <Card key={role.roleName} className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium capitalize flex items-center">
                {getRoleIcon(role.roleName)}
                {role.roleName.replace(/_/g, ' ')}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedRole(role); setIsSettingsModalOpen(true); }}>
                <Settings className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-xs text-muted-foreground">
                {role.isDeletable ? "Custom Role" : "System Role"}
              </p>
            </CardContent>
          </Card>
        ))}
        {sortedRoles.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">No roles found.</p>
        )}
      </div>

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
                <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? (
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

      {/* --- Role Settings Modal --- */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-2xl min-h-[50vh] flex flex-col">
            {selectedRole && (
                <>
                    <DialogHeader>
                        <DialogTitle className="flex items-center capitalize">{getRoleIcon(selectedRole.roleName)} Settings: {selectedRole.roleName.replace(/_/g, ' ')}</DialogTitle>
                        <DialogDescription>Manage permissions and document access for this role.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow">
                        <Tabs defaultValue="documents" className="w-full pt-4">
                            <TabsList><TabsTrigger value="documents">Document Types</TabsTrigger><TabsTrigger value="permissions" disabled>Permissions (Soon)</TabsTrigger></TabsList>
                            <TabsContent value="documents" className="pt-4">
                                <div className="space-y-4">
                                    <Label>Add a new document type this role can upload:</Label>
                                    <div className="flex space-x-2">
                                        <Input 
                                          placeholder="e.g. Pitch Deck, NDA..." 
                                          value={newDocType} 
                                          onChange={(e) => setNewDocType(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleAddDocType();
                                            }
                                          }}
                                        />
                                        <Button onClick={handleAddDocType} disabled={isPermissionActionLoading || !newDocType.trim()}>
                                            {isPermissionActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                                        </Button>
                                    </div>
                                    <div className="border rounded-md p-3 min-h-[150px]">
                                        <h4 className="text-sm font-medium mb-3">Allowed Document Types:</h4>
                                        {selectedRole.documentTypes.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedRole.documentTypes.map(docType => {
                                                  const documentsOfType = roomDetails.documentDetails?.filter(doc => doc.category === docType) || [];
                                                  const canDelete = documentsOfType.length === 0;
                                                  
                                                  return (
                                                    <UiBadge key={docType} variant="secondary" className="text-base flex items-center gap-1">
                                                        {docType}
                                                        {documentsOfType.length > 0 && (
                                                          <span title={`Protected - ${documentsOfType.length} document(s) exist`}>
                                                            <Lock className="h-3 w-3 text-muted-foreground/60" />
                                                          </span>
                                                        )}
                                                        <button 
                                                          onClick={() => handleRemoveDocType(docType)} 
                                                          className={`ml-1 rounded-full p-0.5 ${canDelete ? 'hover:bg-destructive/20' : 'opacity-50 cursor-not-allowed'}`}
                                                          disabled={isPermissionActionLoading || !canDelete}
                                                          title={canDelete ? `Remove ${docType} permission` : `Cannot remove - ${documentsOfType.length} document(s) exist`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </UiBadge>
                                                  );
                                                })}
                                            </div>
                                        ) : (<p className="text-sm text-muted-foreground text-center py-8">No document types assigned.</p>)}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <DialogFooter className="sm:justify-between border-t pt-4">
                        <div>
                            {selectedRole.isDeletable ? (
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setRoleToDelete(selectedRole.roleName);
                                        setIsSettingsModalOpen(false);
                                        setIsDeleteModalOpen(true);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                                </Button>
                            ) : (
                                <p className="text-xs text-muted-foreground pt-2">System roles cannot be deleted.</p>
                            )}
                        </div>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
