import { type RoomDetails, type DocumentInfo, type Member, type RoomRoles, type RoomLog } from '../types/types';
import { useMemo } from 'react';

// Type for state update functions
export type RoomStateUpdater = {
  updateDocument: (updatedDocument: DocumentInfo) => void;
  addDocument: (newDocument: DocumentInfo) => void;
  updateDocumentSignature: (documentId: string, signerEmail: string, signature: string, signedAt?: number) => void;
  addMember: (newMember: Member) => void;
  removeMember: (memberEmail: string) => void;
  updateMemberRole: (memberEmail: string, newRole: string) => void;
  addRole: (newRole: RoomRoles) => void;
  removeRole: (roleName: string) => void;
  updateRolePermissions: (roleName: string, newDocumentTypes: string[]) => void;
  addSignerToDocument: (documentId: string, signerEmail: string, roleToSign: string) => void;
  removeSignerFromDocument: (documentId: string, signerEmail: string) => void;
  addLog: (actor: string, message: string) => void;
};

// Create state updater functions
export function createRoomStateUpdater(
  roomDetails: RoomDetails | null,
  setRoomDetails: React.Dispatch<React.SetStateAction<RoomDetails | null>>,
  documents: DocumentInfo[],
  setDocuments: React.Dispatch<React.SetStateAction<DocumentInfo[]>>,
  currentUserEmail: string | null
): RoomStateUpdater {
  
  const updateDocument = (updatedDocument: DocumentInfo) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.documentId === updatedDocument.documentId ? updatedDocument : doc
      )
    );
  };

  const addDocument = (newDocument: DocumentInfo) => {
    setDocuments(prevDocs => [...prevDocs, newDocument]);
  };

  const updateDocumentSignature = (
    documentId: string, 
    signerEmail: string, 
    signature: string,
    signedAt?: number
  ) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => {
        if (doc.documentId === documentId && doc.emailToSign === signerEmail) {
          return {
            ...doc,
            signed: "true",
            signature: signature,
            signedAt: signedAt || Date.now()
          };
        }
        return doc;
      })
    );
  };

  const addMember = (newMember: Member) => {
    if (!roomDetails) return;
    
    setRoomDetails(prevRoom => {
      if (!prevRoom) return prevRoom;
      return {
        ...prevRoom,
        members: [...prevRoom.members, newMember]
      };
    });
  };

  const removeMember = (memberEmail: string) => {
    if (!roomDetails) return;
    
    setRoomDetails(prevRoom => {
      if (!prevRoom) return prevRoom;
      return {
        ...prevRoom,
        members: prevRoom.members.filter(member => member.userEmail !== memberEmail)
      };
    });

    // Also remove the user from any documents they were assigned to sign
    setDocuments(prevDocs => 
      prevDocs.filter(doc => doc.emailToSign !== memberEmail)
    );
  };

  const updateMemberRole = (memberEmail: string, newRole: string) => {
    if (!roomDetails) return;
  
    // Update member's role in the main member list
    setRoomDetails(prevRoom => {
      if (!prevRoom) return null;
      return {
        ...prevRoom,
        members: prevRoom.members.map(member =>
          member.userEmail === memberEmail
            ? { ...member, role: newRole }
            : member
        ),
      };
    });
  
    // Also update the role in the documents list for any pending signatures
    setDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.emailToSign === memberEmail
          ? { ...doc, roleToSign: newRole }
          : doc
      )
    );
  };

  const addRole = (newRole: RoomRoles) => {
    if (!roomDetails) return;
    
    setRoomDetails(prevRoom => {
      if (!prevRoom) return prevRoom;
      return {
        ...prevRoom,
        roomRoles: [...prevRoom.roomRoles, newRole]
      };
    });
  };

  const removeRole = (roleName: string) => {
    if (!roomDetails) return;
    
    setRoomDetails(prevRoom => {
      if (!prevRoom) return prevRoom;
      return {
        ...prevRoom,
        // Update members who had the deleted role to 'member'
        members: prevRoom.members.map(member => 
          member.role === roleName ? { ...member, role: 'member' } : member
        ),
        // Remove the role from the list of roles
        roomRoles: prevRoom.roomRoles.filter(role => role.roleName !== roleName)
      };
    });

    // Update documents that were assigned to the deleted role
    setDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.roleToSign === roleName
          ? { ...doc, roleToSign: 'member' }
          : doc
      )
    );
  };

  const updateRolePermissions = (roleName: string, newDocumentTypes: string[]) => {
    if (!roomDetails) return;
    
    setRoomDetails(prevRoom => {
      if (!prevRoom) return prevRoom;
      return {
        ...prevRoom,
        roomRoles: prevRoom.roomRoles.map(role => 
          role.roleName === roleName 
            ? { ...role, documentTypes: newDocumentTypes }
            : role
        )
      };
    });
  };

  const addSignerToDocument = (documentId: string, signerEmail: string, roleToSign: string) => {
    // Find the document template to copy its properties
    const templateDoc = documents.find(doc => doc.documentId === documentId);
    if (!templateDoc) return;

    const newSignerRecord: DocumentInfo = {
      ...templateDoc,
      emailToSign: signerEmail,
      roleToSign: roleToSign,
      signed: "false",
      signature: undefined
    };

    setDocuments(prevDocs => [...prevDocs, newSignerRecord]);
  };

  const removeSignerFromDocument = (documentId: string, signerEmail: string) => {
    setDocuments(prevDocs => 
      prevDocs.filter(doc => 
        !(doc.documentId === documentId && doc.emailToSign === signerEmail)
      )
    );
  };

  const addLog = (actor: string, message: string) => {
    if (!roomDetails) return;

    setRoomDetails(prevRoom => {
      if (!prevRoom) return prevRoom;
      return {
        ...prevRoom,
        activityLogs: [{ timestamp: Date.now().toString(), actor, message }, ...prevRoom.activityLogs]
      };
    });
  };

  return {
    updateDocument,
    addDocument,
    updateDocumentSignature,
    addMember,
    removeMember,
    updateMemberRole,
    addRole,
    removeRole,
    updateRolePermissions,
    addSignerToDocument,
    removeSignerFromDocument,
    addLog
  };
}

// Hook for using room state updater
export function useRoomStateUpdater(
  roomDetails: RoomDetails | null,
  setRoomDetails: React.Dispatch<React.SetStateAction<RoomDetails | null>>,
  documents: DocumentInfo[],
  setDocuments: React.Dispatch<React.SetStateAction<DocumentInfo[]>>,
  currentUserEmail: string | null
): RoomStateUpdater {
  return useMemo(() => createRoomStateUpdater(roomDetails, setRoomDetails, documents, setDocuments, currentUserEmail), [roomDetails, setRoomDetails, documents, setDocuments, currentUserEmail]);
} 