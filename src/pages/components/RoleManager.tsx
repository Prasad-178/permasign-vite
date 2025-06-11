/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useActionState, useRef, useState, useEffect, useFormStatus } from "react";
import { type RoomDetails, type ModifyRoleResult } from "../../types/types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "../../components/ui/dialog";
import { PlusCircle, Shield, AlertTriangle, Crown, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addRoleFormAdapter, deleteRoleClientAction } from "../../services/roomActionsClient";
import AddRoleSubmitButton from "./AddRoleSubmitButton";
import DeleteRoleSubmitButton from "./DeleteRoleSubmitButton";

interface RoleManagerProps {
  roomDetails: RoomDetails;
  currentUserEmail: string | null;
  fetchRoomDetails: () => void;
}

const getRoleIcon = (roleName: string) => {
    if (roleName === 'founder') {
        return <Crown className="mr-2 h-4 w-4 text-yellow-500" />;
    }
    const systemRoles = ['cfo', 'investor', 'auditor', 'vendor', 'customer', 'member'];
    if (systemRoles.includes(roleName)) {
        return <User className="mr-2 h-4 w-4 text-muted-foreground" />;
    }
    return <Shield className="mr-2 h-4 w-4 text-muted-foreground" />;
};

export default function RoleManager({ roomDetails, currentUserEmail, fetchRoomDetails }: RoleManagerProps) {
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const addRoleFormRef = useRef<HTMLFormElement>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [addRoleState, addRoleFormAction, isAddRolePending] = useActionState<ModifyRoleResult | null, FormData>(
    addRoleFormAdapter,
    null
  );

  useEffect(() => {
    if (addRoleState) {
      if (addRoleState.success) {
        toast.success("Role Action Successful", { description: addRoleState.message });
        setIsAddRoleModalOpen(false);
        addRoleFormRef.current?.reset();
        fetchRoomDetails();
      } else {
        toast.error("Failed to Add Role", { description: addRoleState.error || addRoleState.message });
      }
    }
  }, [addRoleState, fetchRoomDetails]);

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
        fetchRoomDetails();
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
            <p className="text-muted-foreground">Add or remove custom roles for this room.</p>
        </div>
        <Dialog open={isAddRoleModalOpen} onOpenChange={setIsAddRoleModalOpen}>
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
                  <Input id="newRoleName" name="newRoleName" type="text" title="Role name" required className="col-span-3" placeholder="e.g. Legal Team" />
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
              {role.isDeletable ? (
                <DeleteRoleSubmitButton 
                    roleName={role.roleName} 
                    onClick={() => {
                        setRoleToDelete(role.roleName);
                        setIsDeleteModalOpen(true);
                    }}
                />
              ) : null}
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-xs text-muted-foreground">
                {role.isDeletable ? "Custom role." : "System role."}
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
    </div>
  );
}
