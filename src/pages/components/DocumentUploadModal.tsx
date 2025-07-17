import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Command, CommandGroup, CommandItem, CommandList } from "../../components/ui/command";
import { Check, UserPlus, X, Plus } from "lucide-react";
import type { RoomDetails } from "../../types/types";
import UploadSubmitButton from "./UploadSubmitButton";
import { useEffect, useRef, useState } from "react";

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
  categoryInput: string;
  isCategorySuggestionsOpen: boolean;
  uploadFormRef: React.RefObject<HTMLFormElement>;
  uploadFormAction: (formData: FormData) => void;
  uploadState: any;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSigner: (email?: string) => void;
  onRemoveSigner: (email: string) => void;
  onSetSignerInput: (input: string) => void;
  onSetIsSignerSuggestionsOpen: (open: boolean) => void;
  onSetCategoryInput: (input: string) => void;
  onSetIsCategorySuggestionsOpen: (open: boolean) => void;
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
  categoryInput,
  isCategorySuggestionsOpen,
  uploadFormRef,
  uploadFormAction,
  uploadState,
  onFileChange,
  onAddSigner,
  onRemoveSigner,
  onSetSignerInput,
  onSetIsSignerSuggestionsOpen,
  onSetCategoryInput,
  onSetIsCategorySuggestionsOpen
}: DocumentUploadModalProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileDataB64, setFileDataB64] = useState<string>("");
  const [isConvertingFile, setIsConvertingFile] = useState(false);

  // Convert selectedFile to base64 when needed (optimized for performance)
  useEffect(() => {
    if (selectedFile) {
      // Only convert small files immediately (< 5MB), delay larger files
      if (selectedFile.size < 5 * 1024 * 1024) {
        setIsConvertingFile(true);
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            // Remove the data URL prefix to get just the base64 data
            const base64Data = result.split(',')[1];
            setFileDataB64(base64Data);
          }
          setIsConvertingFile(false);
        };
        reader.onerror = () => {
          console.error("Error converting file to base64");
          setIsConvertingFile(false);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // For large files, just clear the base64 data - it will be converted when needed
        setFileDataB64("");
      }
    } else {
      setFileDataB64("");
    }
  }, [selectedFile]);

    // Update file input when selectedFile changes (from drag and drop)
  useEffect(() => {
    if (selectedFile && fileInputRef.current) {
      try {
        // Create a new FileList with the dropped file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(selectedFile);
        fileInputRef.current.files = dataTransfer.files;
        
        console.log("File input updated successfully via drag & drop:", selectedFile.name);
        console.log("File input now has files:", fileInputRef.current.files?.length);
      } catch (error) {
        console.warn("Could not set file input files property:", error);
      }
    }
  }, [selectedFile]);

  // Set category input when preselectedCategory changes (from upload button clicks)
  useEffect(() => {
    if (preselectedCategory && isOpen) {
      onSetCategoryInput(preselectedCategory.replace(/_/g, ' '));
      console.log("Category preselected:", preselectedCategory);
    }
  }, [preselectedCategory, isOpen, onSetCategoryInput]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Client-side validation before form submission
  const validateForm = () => {
    // Check if we have a file either in the input field OR in selectedFile state (drag & drop)
    const hasFileInInput = fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0;
    const hasFile = hasFileInInput || selectedFile;
    
    if (!hasFile) {
      return "Please select a file to upload.";
    }
    if (!categoryInput || categoryInput.trim() === "") {
      return "Please enter a document category.";
    }
    if (!signers || signers.length === 0) {
      return "Please add at least one signer to the document.";
    }
    return null;
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // If we have selectedFile but file input is empty, try to sync them
    if (selectedFile && fileInputRef.current && (!fileInputRef.current.files || fileInputRef.current.files.length === 0)) {
      try {
        console.log("Attempting to sync selectedFile to file input before submission");
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(selectedFile);
        fileInputRef.current.files = dataTransfer.files;
        console.log("File input synced successfully");
      } catch (error) {
        console.warn("Could not sync file input:", error);
      }
    }
    
    const validationError = validateForm();
    if (validationError) {
      event.preventDefault();
      
      // Show validation error to user
      console.error("Form validation failed:", validationError);
      
      // Check what's missing and provide specific feedback
      const hasFileInInput = fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0;
      console.log("Validation debug:", {
        hasFileInInput,
        selectedFile: !!selectedFile,
        categoryInput,
        signersLength: signers.length,
        fileInputFiles: fileInputRef.current?.files?.length
      });
      
      // Focus on the first empty required field
      if (!hasFileInInput && !selectedFile) {
        // File is missing
        if (fileInputRef.current) {
          fileInputRef.current.focus();
        }
      } else if (!categoryInput || categoryInput.trim() === "") {
        const categoryInputElement = document.querySelector('input[placeholder*="category"]') as HTMLInputElement;
        if (categoryInputElement) {
          categoryInputElement.focus();
        }
      } else if (!signers || signers.length === 0) {
        const signerInputElement = document.querySelector('input[placeholder*="email"]') as HTMLInputElement;
        if (signerInputElement) {
          signerInputElement.focus();
        }
      }
      return;
    }
    
    console.log("Form validation passed, submitting...");
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
        <form ref={uploadFormRef} action={uploadFormAction} onSubmit={handleFormSubmit}>
          <input type="hidden" name="roomId" value={roomId} />
          <input type="hidden" name="uploaderEmail" value={currentUserEmail || ""} />
          <input type="hidden" name="role" value={currentUserRole || ""} />
          <input type="hidden" name="roomPubKey" value={roomPublicKey || ""} />
          <input type="hidden" name="signers" value={signers.join(',')} />
          <input type="hidden" name="category" value={categoryInput} />
          {selectedFile && (
            <>
              <input type="hidden" name="fileName" value={selectedFile.name} />
              <input type="hidden" name="fileSize" value={selectedFile.size.toString()} />
              <input type="hidden" name="fileType" value={selectedFile.type} />
              <input type="hidden" name="fileDataB64" value={fileDataB64} />
              {/* Flag to indicate if base64 data is available */}
              <input type="hidden" name="hasBase64Data" value={fileDataB64 ? "true" : "false"} />
            </>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="documentFile" className="text-right pt-2">File <span className="text-destructive">*</span></Label>
              <div className="col-span-3">
                <Input 
                  ref={fileInputRef}
                  id="documentFile" 
                  name="documentFile" 
                  type="file" 
                  className="w-full" 
                  onChange={onFileChange} 
                  required={false}
                  style={selectedFile ? { opacity: 0.6 } : {}}
                />
                {fileError && <p className="text-sm text-destructive mt-2">{fileError}</p>}
                {selectedFile && (
                  <div className="mt-2 text-sm text-muted-foreground text-center border rounded-lg p-2 bg-muted">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    {isConvertingFile && (
                      <div className="mt-1 text-xs text-blue-600">
                        Processing file...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Category <span className="text-destructive">*</span></Label>
              <div className="col-span-3">
                <div className="relative category-input-container">
                  <Input
                    placeholder="Type or select a document category..."
                    value={categoryInput}
                    onChange={(e) => onSetCategoryInput(e.target.value)}
                    onFocus={() => onSetIsCategorySuggestionsOpen(true)}
                    className="w-full"
                    required
                  />
                  {isCategorySuggestionsOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
                      <Command>
                        <CommandList className="max-h-[200px] overflow-auto">
                          {(() => {
                            const filteredCategories = allowedUploadCategories
                              .filter(category => 
                                category.toLowerCase().includes(categoryInput.toLowerCase())
                              );
                            
                            const hasValidCategory = categoryInput && categoryInput.trim().length > 0;
                            const isExistingCategory = allowedUploadCategories.some(cat => 
                              cat.toLowerCase() === categoryInput.toLowerCase()
                            );
                            
                            return (
                              <>
                                {filteredCategories.length > 0 && (
                                  <CommandGroup heading="Existing Categories">
                                    {filteredCategories.map(category => (
                                      <CommandItem
                                        key={category}
                                        value={category}
                                        onSelect={() => {
                                          onSetCategoryInput(category);
                                          onSetIsCategorySuggestionsOpen(false);
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                                {hasValidCategory && !isExistingCategory && (
                                  <CommandGroup heading="Create New Category">
                                    <CommandItem
                                      value={categoryInput}
                                      onSelect={() => {
                                        onSetIsCategorySuggestionsOpen(false);
                                      }}
                                      className="cursor-pointer text-primary"
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      <span>Create "{categoryInput.replace(/_/g, ' ')}"</span>
                                    </CommandItem>
                                  </CommandGroup>
                                )}
                                {filteredCategories.length === 0 && !hasValidCategory && (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    Start typing to create a new category or search existing ones...
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
                <p className="text-xs text-muted-foreground mt-1">
                  Type a new category name or select from existing ones
                </p>
              </div>
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
                                    <CommandGroup heading="Add New Signer">
                                      <CommandItem
                                        value={signerInput}
                                        onSelect={() => {
                                          onAddSigner(signerInput);
                                        }}
                                        className="cursor-pointer text-primary"
                                      >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        <span>Add {signerInput}</span>
                                      </CommandItem>
                                    </CommandGroup>
                                  )}
                                  {filteredMembers.length === 0 && !hasValidEmail && (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                      Type a valid email address to add as signer...
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