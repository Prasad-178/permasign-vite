import React from "react";
import { format } from "date-fns";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Eye, Download, Loader2 } from "lucide-react";

// Define the document type based on your data structure
interface Document {
  documentId: string;
  uploadedAt: number;
  originalFilename: string;
  category: string;
  uploaderEmail: string;
  emailToSign?: string;
  roleToSign?: string;
  signed?: string;
  contentType: string;
  fileSize: number;
}

// Group documents by ID and check if all signers have signed
export const getVerifiedDocuments = (documents: Document[]): Document[] => {
  // First, group documents by their ID
  const documentGroups = new Map<string, Document[]>();
  
  documents.forEach((doc) => {
    if (!documentGroups.has(doc.documentId)) {
      documentGroups.set(doc.documentId, []);
    }
    documentGroups.get(doc.documentId)?.push(doc);
  });
  
  // For each group, check if all signers have signed
  const verifiedDocuments: Document[] = [];
  
  documentGroups.forEach((docs) => {
    const allSigned = docs.every(doc => doc.signed === "true");
    
    if (allSigned && docs.length > 0) {
      // Use the first document as the representative
      verifiedDocuments.push(docs[0]);
    }
  });
  
  // Sort by uploadedAt date (most recent first)
  return verifiedDocuments.sort((a, b) => b.uploadedAt - a.uploadedAt);
};

// Get category label for display
const getCategoryLabel = (category: string): string => {
  const categoryMap: Record<string, string> = {
    "founders_agreement": "Founders Agreement",
    "board_resolutions": "Board Resolutions",
    "cap_table": "Cap Table",
    "registration_certificates": "Registration Certificates",
    "licences_and_certifications": "Licences & Certifications",
    "termsheet": "Term Sheet",
    "shareholders_agreement": "Shareholders Agreement",
    "safe_convertible_notes": "SAFE / Convertible Notes",
    "audit_report": "Audit Report",
    "procurement_contract": "Procurement Contract",
    "quality_assurance_agreement": "Quality Assurance Agreement",
    "master_service": "Master Service Agreement",
    "statement_of_work": "Statement of Work",
  };
  
  return categoryMap[category] || category;
};

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

interface DocumentTimelineProps {
  documents: Document[];
  isViewingDoc?: string | null;
  isDownloadingDoc?: string | null;
  onViewDocument?: (documentId: string) => void;
  onDownloadDocument?: (documentId: string) => void;
}

const DocumentTimeline: React.FC<DocumentTimelineProps> = ({ 
  documents, 
  isViewingDoc, 
  isDownloadingDoc, 
  onViewDocument, 
  onDownloadDocument 
}) => {
  // Get verified documents sorted by date
  const verifiedDocuments = getVerifiedDocuments(documents);
  
  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <h3 className="text-xl font-semibold mb-12 text-center">Document Trail</h3>
      
      {verifiedDocuments.length === 0 ? (
        <div className="text-center my-10 text-muted-foreground">
          <p>No verified documents found.</p>
          <p className="text-sm">Signed documents will appear here.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Central Vertical Line */}
          <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-gray-600 transform -translate-x-1/2" />
          
          <div className="space-y-16">
            {verifiedDocuments.map((doc, index) => {
              const isRightSide = index % 2 === 0;
              const formattedDate = format(new Date(doc.uploadedAt), "PP");
              
              return (
                <div key={doc.documentId} className={`relative flex items-center ${isRightSide ? 'justify-start' : 'justify-end'}`}>
                  {/* Timeline Node on the central line */}
                  <div className="absolute left-1/2 w-4 h-4 bg-gray-400 rounded-full transform -translate-x-1/2 border-2 border-background z-10" />
                  
                  {/* Wrapper that holds card and buttons together on one side of the line */}
                  <div className={`${isRightSide ? 'mr-0' : 'ml-0'} flex items-center gap-3`}>
                    {isRightSide ? (
                      <>
                        {/* LEFT SIDE: Buttons then Card (card near the line); Eye closest to card */}
                        {onViewDocument && onDownloadDocument && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-background shadow-md border"
                              onClick={() => onDownloadDocument(doc.documentId)}
                              disabled={!!isViewingDoc || !!isDownloadingDoc}
                              title="Download Document"
                            >
                              {isDownloadingDoc === doc.documentId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-background shadow-md border"
                              onClick={() => onViewDocument(doc.documentId)}
                              disabled={!!isViewingDoc || !!isDownloadingDoc}
                              title="View Document"
                            >
                              {isViewingDoc === doc.documentId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Card sits closer to the line on the left side */}
                        <div
                          className={`
                            w-72
                            p-4
                            border rounded-lg shadow-md bg-card
                            relative
                          `}
                        >
                          {/* Content inside the card */}
                          <div className={`flex flex-col mb-2 ${isRightSide ? '' : 'items-end'}`}>
                            <div className={isRightSide ? '' : 'text-right'}>
                              <div className="font-medium text-base mb-1">{getCategoryLabel(doc.category)}</div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                {doc.originalFilename}
                              </p>
                            </div>
                            <Badge variant="outline" className={`mt-1 ${isRightSide ? 'self-start' : 'self-end'}`}>
                              {formattedDate}
                            </Badge>
                          </div>
                          <div className={`flex justify-between text-xs text-muted-foreground ${isRightSide ? '' : 'flex-row-reverse'}`}>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>By: {doc.uploaderEmail}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* RIGHT SIDE: Card then Buttons (card near the line); Eye closest to card */}
                        <div
                          className={`
                            w-72
                            p-4
                            border rounded-lg shadow-md bg-card
                            relative
                          `}
                        >
                          <div className={`flex flex-col mb-2 ${isRightSide ? '' : 'items-end'}`}>
                            <div className={isRightSide ? '' : 'text-right'}>
                              <div className="font-medium text-base mb-1">{getCategoryLabel(doc.category)}</div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                {doc.originalFilename}
                              </p>
                            </div>
                            <Badge variant="outline" className={`mt-1 ${isRightSide ? 'self-start' : 'self-end'}`}>
                              {formattedDate}
                            </Badge>
                          </div>
                          <div className={`flex justify-between text-xs text-muted-foreground ${isRightSide ? '' : 'flex-row-reverse'}`}>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>By: {doc.uploaderEmail}</span>
                          </div>
                        </div>

                        {onViewDocument && onDownloadDocument && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-background shadow-md border"
                              onClick={() => onViewDocument(doc.documentId)}
                              disabled={!!isViewingDoc || !!isDownloadingDoc}
                              title="View Document"
                            >
                              {isViewingDoc === doc.documentId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-background shadow-md border"
                              onClick={() => onDownloadDocument(doc.documentId)}
                              disabled={!!isViewingDoc || !!isDownloadingDoc}
                              title="Download Document"
                            >
                              {isDownloadingDoc === doc.documentId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTimeline;
