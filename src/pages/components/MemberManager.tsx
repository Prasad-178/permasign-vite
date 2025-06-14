/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { type RoomDetails, type ModifyMemberResult, type UpdateMemberRoleResult } from "../../types/types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "../../components/ui/dialog";
import { UserPlus, Crown, User, Shield, UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addMemberFormAdapter, removeMemberFormAdapter, updateMemberRoleFormAdapter } from "../../services/roomActionsClient";
import AddMemberSubmitButton from "./AddMemberSubmitButton";
import RemoveMemberSubmitButton from "./RemoveMemberSubmitButton";

interface MemberManagerProps {
  roomDetails: RoomDetails;
  currentUserEmail: string | null;
  fetchRoomDetails: () => void;
}

const getRoleIcon = (roleName: string, className: string) => {
    if (roleName === 'founder') {
        return <Crown className={className} />;
    }
    if (roleName === 'member') {
      return <User className={className} />;
    }
    return <Shield className={className} />;
};

export default function MemberManager({ roomDetails, currentUserEmail, fetchRoomDetails }: MemberManagerProps) {
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberToUpdate, setMemberToUpdate] = useState<{ email: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState("");
  const addMemberFormRef = useRef<HTMLFormElement>(null);
  const updateRoleFormRef = useRef<HTMLFormElement>(null);

  const [addMemberState, addMemberFormAction, isAddMemberPending] = useActionState<ModifyMemberResult | null, FormData>(
    addMemberFormAdapter,
    null
  );

  const [removeMemberState, removeMemberFormAction, isRemoveMemberPending] = useActionState<ModifyMemberResult | null, FormData>(
    removeMemberFormAdapter,
    null
  );

  const [updateRoleState, updateRoleFormAction, isUpdateRolePending] = useActionState<UpdateMemberRoleResult | null, FormData>(
    updateMemberRoleFormAdapter,
    null
  );

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

  useEffect(() => {
    if (updateRoleState) {
      if (updateRoleState.success) {
        toast.success("Role Updated", { description: updateRoleState.message });
        setMemberToUpdate(null);
        if (updateRoleFormRef.current) updateRoleFormRef.current.reset();
        fetchRoomDetails();
      } else {
        toast.error("Failed to update role", {
          description: updateRoleState.error || updateRoleState.message || "An unknown error occurred.",
          duration: 7000
        });
      }
    }
  }, [updateRoleState, fetchRoomDetails]);

  const currentUserRole = roomDetails.members.find(m => m.userEmail === currentUserEmail)?.role;
  const isFounder = currentUserRole === 'founder';
  const isCFO = currentUserRole === 'cfo';

  const canManageMembers = isFounder || isCFO;
  // Users should be able to assign any role except 'founder'.
  const availableRolesToAdd = roomDetails.roomRoles.filter(role => role.roleName !== 'founder');

  const handleOpenUpdateModal = (member: { userEmail: string; role: string }) => {
    setMemberToUpdate({ email: member.userEmail, role: member.role });
    setNewRole(member.role);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Room Members</h2>
          <p className="text-sm text-muted-foreground">Manage who has access to this room.</p>
        </div>
        {canManageMembers && (
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
                <input type="hidden" name="roomId" value={roomDetails.roomId} />
                <input type="hidden" name="callerEmail" value={currentUserEmail || ""} />
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newUserEmail" className="text-right">Email</Label>
                    <Input id="newUserEmail" name="newUserEmail" type="email" required className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newUserRole" className="text-right">Role</Label>
                    <Select name="newUserRole" required>
                      <SelectTrigger className="col-span-3 capitalize">
                        <SelectValue placeholder="Select a role to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRolesToAdd.length > 0 ? availableRolesToAdd.map(role => (
                            <SelectItem key={role.roleName} value={role.roleName} className="capitalize">{role.roleName.replace(/_/g, ' ')}</SelectItem>
                        )) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No roles available to assign.</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {addMemberState && !addMemberState.success && (
                  <p className="text-sm text-destructive text-center pb-4">
                    Error: {addMemberState.message} {addMemberState.error ? `(${addMemberState.error})` : ''}
                  </p>
                )}
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
            <li key={member.userEmail} className="flex items-center justify-between p-2 hover:bg-muted/30 transition-colors border rounded-md">
              <div className="flex items-center gap-3">
                {getRoleIcon(member.role, "h-5 w-5 text-muted-foreground")}
                <div>
                  <p className="font-medium">{member.userEmail} {member.userEmail === currentUserEmail ? <span className="text-xs font-normal text-muted-foreground">(You)</span> : ''}</p>
                  <p className="text-sm capitalize text-muted-foreground">{member.role.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isFounder && member.role !== 'founder' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenUpdateModal(member)}
                    title={`Update ${member.userEmail}'s role`}
                  >
                    <UserCog className="h-4 w-4" />
                  </Button>
                )}
                {canManageMembers && member.role !== 'founder' && (
                  <form action={removeMemberFormAction}>
                    <input type="hidden" name="roomId" value={roomDetails.roomId} />
                    <input type="hidden" name="callerEmail" value={currentUserEmail || ""} />
                    <input type="hidden" name="userToRemoveEmail" value={member.userEmail} />
                    <RemoveMemberSubmitButton email={member.userEmail} />
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
        {removeMemberState && !removeMemberState.success && (
          <p className="text-sm text-destructive text-center pt-4">
            Error removing member: {removeMemberState.message} {removeMemberState.error ? `(${removeMemberState.error})` : ''}
          </p>
        )}
      </div>

      {/* Update Member Role Dialog */}
      <Dialog open={!!memberToUpdate} onOpenChange={(isOpen) => !isOpen && setMemberToUpdate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Member Role</DialogTitle>
            <DialogDescription>
              Change the role for <span className="font-semibold">{memberToUpdate?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <form ref={updateRoleFormRef} action={updateRoleFormAction}>
            <input type="hidden" name="roomId" value={roomDetails.roomId} />
            <input type="hidden" name="callerEmail" value={currentUserEmail || ""} />
            <input type="hidden" name="memberEmailToUpdate" value={memberToUpdate?.email || ""} />
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newRole" className="text-right">New Role</Label>
                <Select name="newRole" required value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="col-span-3 capitalize">
                    <SelectValue placeholder="Select a new role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRolesToAdd.map(role => (
                        <SelectItem key={role.roleName} value={role.roleName} className="capitalize">
                          {role.roleName.replace(/_/g, ' ')}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {updateRoleState && !updateRoleState.success && (
              <p className="text-sm text-destructive text-center pb-4">
                Error: {updateRoleState.message} {updateRoleState.error ? `(${updateRoleState.error})` : ''}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdateRolePending || newRole === memberToUpdate?.role}>
                {isUpdateRolePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 