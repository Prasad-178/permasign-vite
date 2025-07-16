import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Command, CommandGroup, CommandItem, CommandList } from "../../components/ui/command";
import { Check, UserPlus, Loader2 } from "lucide-react";
import { type RoomDetails } from "../../types/types";

interface AddSignerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roomDetails: RoomDetails | null;
  addSignerDocDetails: { documentId: string; currentSigners: string[] } | null;
  newSignerEmail: string;
  setNewSignerEmail: (email: string) => void;
  isSubmittingSigner: boolean;
  onAddSignerToDocument: () => Promise<void>;
  onSetAddSignerDocDetails: (details: { documentId: string; currentSigners: string[] } | null) => void;
}

export default function AddSignerModal({
  isOpen,
  onOpenChange,
  roomDetails,
  addSignerDocDetails,
  newSignerEmail,
  setNewSignerEmail,
  isSubmittingSigner,
  onAddSignerToDocument,
  onSetAddSignerDocDetails
}: AddSignerModalProps) {
  const [isAddSignerSuggestionsOpen, setIsAddSignerSuggestionsOpen] = useState(false);

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setNewSignerEmail("");
      onSetAddSignerDocDetails(null);
      setIsAddSignerSuggestionsOpen(false);
    }
  };

  const handleCancel = () => {
    setNewSignerEmail("");
    onSetAddSignerDocDetails(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
                                    setNewSignerEmail(newSignerEmail);
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
            <Button type="button" variant="outline" onClick={handleCancel} className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={onAddSignerToDocument} disabled={isSubmittingSigner || !newSignerEmail}>
            {isSubmittingSigner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Signer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 