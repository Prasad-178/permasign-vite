/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { type RoomDetails, type ModifyMemberResult } from "../../types/types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "../../components/ui/dialog";
import { UserPlus, Crown, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { addMemberFormAdapter, removeMemberFormAdapter } from "../../services/roomActionsClient";
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
    // All other roles, system or custom, get a user or shield icon.
    const systemRoles = ['cfo', 'investor', 'auditor', 'vendor', 'customer', 'member'];
    if (systemRoles.includes(roleName)) {
        return <User className={className} />;
    }
    return <Shield className={className} />;
};

export default function MemberManager({ roomDetails, currentUserEmail, fetchRoomDetails }: MemberManagerProps) {
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const addMemberFormRef = useRef<HTMLFormElement>(null);

  const [addMemberState, addMemberFormAction] = useActionState<ModifyMemberResult | null, FormData>(
    addMemberFormAdapter,
    null
  );

  const [removeMemberState, removeMemberFormAction, isRemoveMemberPending] = useActionState<ModifyMemberResult | null, FormData>(
    removeMemberFormAdapter,
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

  const currentUserRole = roomDetails.members.find(m => m.userEmail === currentUserEmail)?.role;
  const isFounder = currentUserRole === 'founder';
  const isCFO = currentUserRole === 'cfo';

  const canManageMembers = isFounder || isCFO;
  // Users should be able to assign any role except 'founder'.
  const availableRolesToAdd = roomDetails.roomRoles.filter(role => role.roleName !== 'founder');

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
                <div className="flex items-center mt-1">
                    {getRoleIcon(member.role, "h-3.5 w-3.5 mr-1.5 text-muted-foreground")}
                    <p className="text-xs capitalize text-muted-foreground">{member.role.replace(/_/g, ' ')}</p>
                </div>
              </div>
              {canManageMembers && member.role !== 'founder' && (
                <form action={removeMemberFormAction}>
                  <input type="hidden" name="roomId" value={roomDetails.roomId} />
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
    </>
  );
} 