import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Command, CommandGroup, CommandItem, CommandList } from "../../components/ui/command";
import { Check, UserPlus, X } from "lucide-react";
import type { RoomDetails } from "../../types/types";
import UploadSubmitButton from "./UploadSubmitButton";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  currentUserEmail: string | null;
  currentUserRole: string | null;
  roomPublicKey: string | undefined;
  allowedUploadCategories: string[];
  roomDetails: RoomDetails;
  preselectedCategory: string | null;
  selectedFile: File | null;
  fileError: string | null;
  signers: string[];
  signerInput: string;
  isSignerSuggestionsOpen: boolean;
  uploadFormRef: React.RefObject<HTMLFormElement>;
  uploadFormAction: (formData: FormData) => void;
  uploadState: any;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSigner: (email?: string) => void;
  onRemoveSigner: (email: string) => void;
  onSetSignerInput: (input: string) => void;
  onSetIsSignerSuggestionsOpen: (open: boolean) => void;
}

export default function DocumentUploadModal({
  isOpen,
  onOpenChange,
  roomId,
  currentUserEmail,
  currentUserRole,
  roomPublicKey,
  allowedUploadCategories,
  roomDetails,
  preselectedCategory,
  selectedFile,
  fileError,
  signers,
  signerInput,
  isSignerSuggestionsOpen,
  uploadFormRef,
  uploadFormAction,
  uploadState,
  onFileChange,
  onAddSigner,
  onRemoveSigner,
  onSetSignerInput,
  onSetIsSignerSuggestionsOpen
}: DocumentUploadModalProps) {

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
          <DialogDescription>
            Select an agreement to upload to the company's shared space.
          </DialogDescription>
        </DialogHeader>
        <form ref={uploadFormRef} action={uploadFormAction}>
          <input type="hidden" name="roomId" value={roomId} />
          <input type="hidden" name="uploaderEmail" value={currentUserEmail || ""} />
          <input type="hidden" name="role" value={currentUserRole || ""} />
          <input type="hidden" name="roomPubKey" value={roomPublicKey || ""} />
          <input type="hidden" name="signers" value={signers.join(',')} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="documentFile" className="text-right pt-2">File <span className="text-destructive">*</span></Label>
              <div className="col-span-3">
                <Input id="documentFile" name="documentFile" type="file" className="w-full" onChange={onFileChange} required />
                {fileError && <p className="text-sm text-destructive mt-2">{fileError}</p>}
                {selectedFile && (
                  <div className="mt-2 text-sm text-muted-foreground text-center border rounded-lg p-2 bg-muted">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category <span className="text-destructive">*</span></Label>
              <Select name="category" required key={preselectedCategory} defaultValue={preselectedCategory ?? undefined}>
                <SelectTrigger className="col-span-3 capitalize"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {allowedUploadCategories.length > 0 ? (
                    allowedUploadCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat.replace(/_/g, ' ')}</SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No upload categories available for your role.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4 pt-2">
              <Label className="text-right pt-2">Signers <span className="text-destructive">*</span></Label>
              <div className="col-span-3">
                <div className="flex gap-2">
                  <div className="relative w-full signer-input-container">
                    <Input
                      placeholder="Type email or search members..."
                      value={signerInput}
                      onChange={(e) => onSetSignerInput(e.target.value)}
                      onFocus={() => onSetIsSignerSuggestionsOpen(true)}
                      className="w-full"
                    />
                    {isSignerSuggestionsOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
                        <Command>
                          <CommandList className="max-h-[200px] overflow-auto">
                            {(() => {
                              const filteredMembers = roomDetails?.members
                                .filter(member => 
                                  !signers.includes(member.userEmail) &&
                                  member.userEmail.toLowerCase().includes(signerInput.toLowerCase())
                                ) || [];
                              
                              const hasValidEmail = signerInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerInput);
                              const isExistingMember = roomDetails?.members.some(m => m.userEmail === signerInput);
                              
                              return (
                                <>
                                  {filteredMembers.length > 0 && (
                                    <CommandGroup heading="Room Members">
                                      {filteredMembers.map(member => (
                                        <CommandItem
                                          key={member.userEmail}
                                          value={member.userEmail}
                                          onSelect={() => {
                                            onAddSigner(member.userEmail);
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
                                  {hasValidEmail && !isExistingMember && (
                                    <CommandGroup heading="Add New Member">
                                      <CommandItem
                                        value={signerInput}
                                        onSelect={() => {
                                          onAddSigner(signerInput);
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        <div className="flex flex-col">
                                          <span>Add "{signerInput}"</span>
                                          <span className="text-xs text-muted-foreground">Will be added as a member</span>
                                        </div>
                                      </CommandItem>
                                    </CommandGroup>
                                  )}
                                  {filteredMembers.length === 0 && !hasValidEmail && signerInput && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                      {signerInput ? "Enter a valid email address" : "No members found"}
                                    </div>
                                  )}
                                  {!signerInput && (
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
                  <Button type="button" onClick={() => onAddSigner()} disabled={!signerInput}>Add</Button>
                </div>
                {signers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {signers.map(signer => (
                      <div key={signer} className="flex items-center gap-1.5 bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                        <span>{signer}</span>
                        {signer !== roomDetails?.ownerEmail && (
                          <button type="button" onClick={() => onRemoveSigner(signer)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
  );
} 