import { type ActionResult, type RoomInfo, type CreateRoomInput, type CreateRoomResult, type AddMemberInput, type RemoveMemberInput, type ModifyMemberResult, type RoomRole, type GetRoomDetailsResult, type RetrieveDocumentApiInput, type RetrieveDocumentResult, type SignDocumentApiInput, type SignDocumentResult, type UploadDocumentApiInput, type UploadDocumentResult, type AddRoleInput, type DeleteRoleInput, type ModifyRoleResult, type AddRolePermissionInput, type RemoveRolePermissionInput, type AddSignerToDocumentInput, type RemoveSignerFromDocumentInput, type ModifySignerResult, type UpdateMemberRoleInput, type UpdateMemberRoleResult } from '../types/types';

// Define the base URL for your external API.
// It's good practice to use an environment variable for this.
// For example, in your .env.local file: VITE_API_ROOT=http://localhost:3001
const API_ROOT = "https://permasign-backend-production.up.railway.app";
// const API_ROOT = "http://localhost:3001";
const API_BASE_PATH = "/api/actions"; // Matches your Express server routes

// Fallback for local development if the environment variable is not set.
const effectiveApiRoot = API_ROOT;

// Helper function to convert a File to a base64 string
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // result is a data URL (e.g., "data:image/png;base64,iVBORw0KGgo...")
      // We need to strip the "data URI scheme" prefix
      const base64String = (reader.result as string).split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to extract base64 string from file."));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Fetches the list of data rooms for a user by calling the external API.
 * This function maintains the same signature and return type as the original server action
 * to minimize changes in the calling frontend components.
 * @param userEmail The email of the user.
 * @returns A Promise resolving to an ActionResult containing RoomInfo array or an error.
 */
export async function listMyDataRooms(userEmail: string): Promise<ActionResult<RoomInfo[]>> {
    console.log(`Client Service: Fetching rooms for user ${userEmail} from ${effectiveApiRoot}${API_BASE_PATH}/list-my-datarooms`);

    if (!userEmail) {
        // Return structure consistent with original server action for this case
        return { success: false, error: "User email is required." };
    }

    try {
        const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/list-my-datarooms?userEmail=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json', // Important to tell the server we expect JSON
            },
        });

        // Try to parse the JSON response body, useful for both success and error cases if API returns JSON errors
        const responseData: ActionResult<RoomInfo[]> = await response.json();

        if (!response.ok) {
            console.error("API error response:", response.status, responseData);
            // The Express server should already return an ActionResult-like object in case of errors.
            // We prioritize `responseData.error` and `responseData.message` if available.
            return {
                success: false,
                error: responseData?.error || `API request failed with status ${response.status}`,
                message: responseData?.message || `Failed to fetch rooms. Server responded with ${response.status}.`,
                // data might be undefined or contain partial error info from server
                data: responseData?.data || undefined,
            };
        }

        // If response.ok, the Express server returns the original ActionResult directly.
        console.log("Client Service: Rooms fetched successfully via API:", responseData);
        return responseData;

    } catch (error: any) {
        console.error("Client Service: Error in listMyDataRooms fetch call:", error);
        // This catches network errors, DNS issues, or if `fetch` itself throws an error
        return {
            success: false,
            message: "Failed to list data rooms due to a network or client-side error.",
            error: error.message || "An unexpected error occurred while trying to contact the server.",
        };
    }
}

/**
 * Creates a new room by calling the external API.
 * This function maintains a similar signature and return type to the original server action.
 * @param input The data required for creating a room.
 * @returns A Promise resolving to a CreateRoomResult.
 */
export async function createRoomWithKmsAction(
  input: CreateRoomInput
): Promise<CreateRoomResult> {
  console.log(`Client Service: Creating room "${input.roomName}" via API: ${effectiveApiRoot}${API_BASE_PATH}/create-room-with-kms`);
  console.warn("Client Service: Sending RAW room private key to external API for KMS encryption."); // Reminder of security flow

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/create-room-with-kms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: CreateRoomResult = await response.json();

    if (!response.ok) {
      console.error("API error response during room creation:", response.status, responseData);
      // The Express server is expected to return a CreateRoomResult-like object even on error.
      // Prioritize messages/errors from the responseData if available.
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to create room.",
        roomId: responseData?.roomId, // It's unlikely to have roomId on error, but include if present
        messageId: responseData?.messageId,
      };
    }

    console.log("Client Service: Room creation API call successful:", responseData);
    // If response.ok, responseData is the CreateRoomResult from the Express server.
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in createRoomWithKmsAction fetch call:", error);
    return {
      success: false,
      message: "Failed to create room due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

/**
 * Client-side function to add a member to a room by calling the external API.
 * @param input Data required to add a member.
 * @returns A Promise resolving to ModifyMemberResult.
 */
export async function addMemberClientAction(
  input: AddMemberInput
): Promise<ModifyMemberResult> {
  console.log(`Client Service: Adding member ${input.newUserEmail} to room ${input.roomId} via API`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/add-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: ModifyMemberResult = await response.json();

    if (!response.ok) {
      console.error("API error response during add member:", response.status, responseData);
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to add member.",
        messageId: responseData?.messageId,
      };
    }

    console.log("Client Service: Add member API call successful:", responseData);
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in addMemberClientAction fetch call:", error);
    return {
      success: false,
      message: "Failed to add member due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

/**
 * Client-side function to remove a member from a room by calling the external API.
 * @param input Data required to remove a member.
 * @returns A Promise resolving to ModifyMemberResult.
 */
export async function removeMemberClientAction(
  input: RemoveMemberInput
): Promise<ModifyMemberResult> {
  console.log(`Client Service: Removing member ${input.userToRemoveEmail} from room ${input.roomId} via API`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/remove-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: ModifyMemberResult = await response.json();

    if (!response.ok) {
      console.error("API error response during remove member:", response.status, responseData);
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to remove member.",
        messageId: responseData?.messageId,
      };
    }

    console.log("Client Service: Remove member API call successful:", responseData);
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in removeMemberClientAction fetch call:", error);
    return {
      success: false,
      message: "Failed to remove member due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

/**
 * [NEW] Client-side function to update a member's role in a room by calling the external API.
 * @param input Data required to update a member's role.
 * @returns A Promise resolving to UpdateMemberRoleResult.
 */
export async function updateMemberRoleClientAction(
  input: UpdateMemberRoleInput
): Promise<UpdateMemberRoleResult> {
  console.log(`Client Service: Updating role for ${input.memberEmailToUpdate} to ${input.newRole} in room ${input.roomId} via API`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/update-member-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: UpdateMemberRoleResult = await response.json();

    if (!response.ok) {
      console.error("API error response during update member role:", response.status, responseData);
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to update member role.",
        messageId: responseData?.messageId,
      };
    }

    console.log("Client Service: Update member role API call successful:", responseData);
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in updateMemberRoleClientAction fetch call:", error);
    return {
      success: false,
      message: "Failed to update member role due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

// Adapter function for useActionState with addMemberClientAction
export async function addMemberFormAdapter(
  prevState: ModifyMemberResult | null,
  formData: FormData
): Promise<ModifyMemberResult> {
  prevState=prevState;
  const input: AddMemberInput = {
    roomId: formData.get("roomId") as string,
    callerEmail: formData.get("callerEmail") as string,
    newUserEmail: formData.get("newUserEmail") as string,
    newUserRole: formData.get("newUserRole") as RoomRole,
  };

  // Basic client-side validation matching the original server action (optional here, as API will validate)
  if (!input.roomId || !input.callerEmail || !input.newUserEmail || !input.newUserRole) {
    return { success: false, error: "Client validation: Missing required fields." };
  }

  return addMemberClientAction(input);
}

// Adapter function for useActionState with removeMemberClientAction
export async function removeMemberFormAdapter(
  prevState: ModifyMemberResult | null,
  formData: FormData
): Promise<ModifyMemberResult> {
  prevState=prevState;
  const input: RemoveMemberInput = {
    roomId: formData.get("roomId") as string,
    callerEmail: formData.get("callerEmail") as string,
    userToRemoveEmail: formData.get("userToRemoveEmail") as string,
  };

  if (!input.roomId || !input.callerEmail || !input.userToRemoveEmail) {
    return { success: false, error: "Client validation: Missing required fields for removing member." };
  }

  return removeMemberClientAction(input);
}

// [NEW] Adapter function for useActionState with updateMemberRoleClientAction
export async function updateMemberRoleFormAdapter(
  prevState: UpdateMemberRoleResult | null,
  formData: FormData
): Promise<UpdateMemberRoleResult> {
  prevState=prevState;
  const input: UpdateMemberRoleInput = {
    roomId: formData.get("roomId") as string,
    callerEmail: formData.get("callerEmail") as string,
    memberEmailToUpdate: formData.get("memberEmailToUpdate") as string,
    newRole: formData.get("newRole") as RoomRole,
  };

  if (!input.roomId || !input.callerEmail || !input.memberEmailToUpdate || !input.newRole) {
    return { success: false, error: "Client validation: Missing required fields for updating role." };
  }

  return updateMemberRoleClientAction(input);
}

/**
 * Fetches room details by calling the external API.
 * Maintains the same signature as the original server action.
 * @param roomId The ID of the room.
 * @param userEmail The email of the user requesting details.
 * @returns A Promise resolving to GetRoomDetailsResult.
 */
export async function getRoomDetailsAction(
  roomId: string,
  userEmail: string
): Promise<GetRoomDetailsResult> {
  console.log(`Client Service: Fetching details for room ${roomId} as ${userEmail} from ${effectiveApiRoot}${API_BASE_PATH}/get-room-details`);

  if (!roomId || !userEmail) {
    return { success: false, error: "Room ID and User Email are required." };
  }

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/get-room-details?roomId=${encodeURIComponent(roomId)}&userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseData: GetRoomDetailsResult = await response.json();

    if (!response.ok) {
      console.error("API error response during get room details:", response.status, responseData);
      return {
        success: false,
        data: responseData?.data || null, // API might return data:null on error
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to fetch room details.",
        messageId: responseData?.messageId,
      };
    }

    console.log("Client Service: Get room details API call successful:", responseData);
    // The Express server returns the GetRoomDetailsResult directly.
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in getRoomDetailsAction fetch call:", error);
    return {
      success: false,
      data: null,
      message: "Failed to fetch room details due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

/**
 * Client-side function to retrieve and decrypt a document by calling the external API.
 * @param input Data required to retrieve the document.
 * @returns A Promise resolving to RetrieveDocumentResult.
 */
export async function retrieveDocumentClientAction(
  input: RetrieveDocumentApiInput
): Promise<RetrieveDocumentResult> {
  console.log(`Client Service: Retrieving document ${input.documentId} via API`);

  if (!input.documentId || !input.userEmail || !input.decryptedRoomPrivateKeyPem || !input.arweaveTxId || !input.encryptedSymmetricKey) {
      return { success: false, message: "Client validation: Incomplete document details provided. Key fields like arweaveTxId or encryptedSymmetricKey are missing.", error: "Missing input." };
  }

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/retrieve-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: RetrieveDocumentResult = await response.json();

    if (!response.ok) {
      console.error("API error response during retrieve document:", response.status, responseData);
      return {
        success: false,
        data: responseData?.data || null,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to retrieve document.",
      };
    }

    console.log("Client Service: Retrieve document API call successful:", responseData);
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in retrieveDocumentClientAction fetch call:", error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve document due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

/**
 * Client-side function to sign a document by calling the external API.
 * @param input Data required to sign the document.
 * @returns A Promise resolving to SignDocumentResult.
 */
export async function signDocumentClientAction(
  input: SignDocumentApiInput
): Promise<SignDocumentResult> { // Changed from Promise<any> to Promise<SignDocumentResult>
  console.log(`Client Service: Signing document ${input.documentId} for room ${input.roomId} via API`);

  if (!input.documentId || !input.roomId || !input.emailToSign || !input.signature || !input.roleToSign) {
    return { success: false, message: "Client validation: All fields are required for signing.", error: "Missing input." };
  }

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/sign-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: SignDocumentResult = await response.json();

    if (!response.ok) {
      console.error("API error response during sign document:", response.status, responseData);
      return {
        success: false,
        data: responseData?.data || null,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to sign document.",
        messageId: responseData?.messageId,
      };
    }

    // The original action returned ActionResult<RoomInfo[]> on success, so we mirror that.
    // If success, ensure data is an array or default to empty if API might not strictly adhere.
    if (responseData.success && !Array.isArray(responseData.data)) {
        console.warn("Client Service (Sign-Document): Parsed data is not an array, ensuring it is for consistency.");
        responseData.data = responseData.data ? [responseData.data].flat() : []; // Handle if data is single object or null/undefined
    }


    console.log("Client Service: Sign document API call successful:", responseData);
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in signDocumentClientAction fetch call:", error);
    return {
      success: false,
      data: null,
      message: "Failed to sign document due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

/**
 * Client-side function to upload a document (as base64) by calling the external API.
 * @param input Data required to upload the document, including base64 content.
 * @returns A Promise resolving to UploadDocumentResult.
 */
export async function uploadDocumentClientAction(
  input: UploadDocumentApiInput
): Promise<UploadDocumentResult> {
  console.log(`Client Service: Uploading document ${input.fileName} for room ${input.roomId} via API (base64)`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/upload-document`, { // Assuming this is your new API route
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: UploadDocumentResult = await response.json();

    if (!response.ok) {
      console.error("API error response during document upload:", response.status, responseData);
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to upload document.",
        arweaveTx: responseData?.arweaveTx, // Include if API returns it on error
        data: responseData?.data || null,
        messageId: responseData?.messageId
      };
    }

    console.log("Client Service: Document upload API call successful:", responseData);
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in uploadDocumentClientAction fetch call:", error);
    return {
      success: false,
      message: "Failed to upload document due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
      data: null
    };
  }
}

// Adapter function for useActionState with uploadDocumentClientAction
export async function uploadDocumentFormAdapter(
  prevState: UploadDocumentResult | null,
  formData: FormData
): Promise<UploadDocumentResult> {
  prevState=prevState;
  const roomId = formData.get("roomId") as string;
  const uploaderEmail = formData.get("uploaderEmail") as string;
  const documentFile = formData.get("documentFile") as File | null;
  const category = formData.get("category") as string;
  const role = formData.get("role") as RoomRole;
  const roomPubKey = formData.get("roomPubKey") as string;
  const signersString = formData.get("signers") as string;
  const signers = signersString ? signersString.split(',').map(s => s.trim()).filter(s => s) : [];


  // === [MODIFIED] Client-side Validation ===
  // The check for a valid category against a hardcoded list has been removed.
  // The backend now handles the validation against the dynamic role permissions.
  if (!roomId || !uploaderEmail || !documentFile || documentFile.size === 0 || !category || !roomPubKey || !role || !signers || signers.length === 0) {
      console.error("Client Adapter Validation failed. Missing fields:", { roomId: !!roomId, uploaderEmail: !!uploaderEmail, documentFile: !!documentFile, category: !!category, roomPubKey: !!roomPubKey, role: !!role, signers: !!signers && signers.length > 0 });
      return { success: false, message: "Client validation: Missing required fields (roomId, uploaderEmail, file, category, role, room public key, or signers)." , data: null};
  }
  if (documentFile.size > 100 * 1024 * 1024) { // Example: 100MB limit
      return { success: false, message: "Client validation: File is too large (max 100MB).", data: null };
  }

  try {
    console.log("Client Adapter: Converting file to base64...");
    const fileDataB64 = await fileToBase64(documentFile);
    console.log(`Client Adapter: File converted. Base64 string length (approx): ${fileDataB64.length}`);

    const input: UploadDocumentApiInput = {
      roomId,
      uploaderEmail,
      category,
      role,
      roomPubKey,
      fileName: documentFile.name,
      fileType: documentFile.type || "application/octet-stream",
      fileDataB64,
      fileSize: documentFile.size,
      signers,
    };

    return uploadDocumentClientAction(input);

  } catch (error: any) {
    console.error("Client Adapter: Error processing file for upload:", error);
    return {
      success: false,
      message: "Failed to process file before upload.",
      error: error.message || "Client-side file processing error.",
      data: null
    };
  }
}

/**
 * Client-side function to add a role to a room by calling the external API.
 * @param input Data required to add a role.
 * @returns A Promise resolving to ModifyRoleResult.
 */
export async function addRoleClientAction(
  input: AddRoleInput
): Promise<ModifyRoleResult> {
  console.log(`Client Service: Adding role ${input.newRoleName} to room ${input.roomId} via API`);
  
  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/create-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: ModifyRoleResult = await response.json();

    if (!response.ok) {
      console.error("API error response during add role:", response.status, responseData);
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to add role.",
        messageId: responseData?.messageId,
      };
    }

    console.log("Client Service: Add role API call successful:", responseData);
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in addRoleClientAction fetch call:", error);
    return {
      success: false,
      message: "Failed to add role due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

/**
 * Client-side function to delete a role from a room by calling the external API.
 * @param input Data required to delete a role.
 * @returns A Promise resolving to ModifyRoleResult.
 */
export async function deleteRoleClientAction(
  input: DeleteRoleInput
): Promise<ModifyRoleResult> {
  console.log(`Client Service: Deleting role ${input.roleNameToDelete} from room ${input.roomId} via API`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/delete-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const responseData: ModifyRoleResult = await response.json();

    if (!response.ok) {
      console.error("API error response during delete role:", response.status, responseData);
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to delete role.",
        messageId: responseData?.messageId,
      };
    }

    console.log("Client Service: Delete role API call successful:", responseData);
    return responseData;

  } catch (error: any) {
    console.error("Client Service: Error in deleteRoleClientAction fetch call:", error);
    return {
      success: false,
      message: "Failed to delete role due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

// Adapter function for useActionState with addRoleClientAction
export async function addRoleFormAdapter(
  prevState: ModifyRoleResult | null,
  formData: FormData
): Promise<ModifyRoleResult> {
  prevState=prevState;
  const input: AddRoleInput = {
    roomId: formData.get("roomId") as string,
    callerEmail: formData.get("callerEmail") as string,
    newRoleName: (formData.get("newRoleName") as string || "").trim(),
  };

  if (!input.roomId || !input.callerEmail || !input.newRoleName) {
    return { success: false, error: "Client validation: Missing required fields." };
  }

  return addRoleClientAction(input);
}

// Adapter function for useActionState with deleteRoleClientAction
export async function deleteRoleFormAdapter(
  prevState: ModifyRoleResult | null,
  formData: FormData
): Promise<ModifyRoleResult> {
  prevState=prevState;
  const input: DeleteRoleInput = {
    roomId: formData.get("roomId") as string,
    callerEmail: formData.get("callerEmail") as string,
    roleNameToDelete: formData.get("roleNameToDelete") as string,
  };

  if (!input.roomId || !input.callerEmail || !input.roleNameToDelete) {
    return { success: false, error: "Client validation: Missing required fields for deleting role." };
  }

  return deleteRoleClientAction(input);
}

/**
 * [NEW] Client-side function to add a document type permission to a role.
 * @param input Data required to add the permission.
 * @returns A Promise resolving to ModifyRoleResult.
 */
export async function addRolePermissionClientAction(
  input: AddRolePermissionInput
): Promise<ModifyRoleResult> {
  console.log(`Client Service: Adding permission for doc type "${input.documentType}" to role "${input.roleName}" via API`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/add-role-permission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(input),
    });

    const responseData: ModifyRoleResult = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to add permission.",
      };
    }
    return responseData;
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to add permission due to a network or client-side error.",
      error: error.message,
    };
  }
}

/**
 * [NEW] Client-side function to remove a document type permission from a role.
 * @param input Data required to remove the permission.
 * @returns A Promise resolving to ModifyRoleResult.
 */
export async function removeRolePermissionClientAction(
  input: RemoveRolePermissionInput
): Promise<ModifyRoleResult> {
  console.log(`Client Service: Removing permission for doc type "${input.documentType}" from role "${input.roleName}" via API`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/remove-role-permission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(input),
    });

    const responseData: ModifyRoleResult = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to remove permission.",
      };
    }
    return responseData;
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to remove permission due to a network or client-side error.",
      error: error.message,
    };
  }
}

/**
 * [NEW] Client-side function to add a signer to a document.
 * @param input Data required to add the signer.
 * @returns A Promise resolving to ModifySignerResult.
 */
export async function addSignerToDocumentClientAction(
  input: AddSignerToDocumentInput
): Promise<ModifySignerResult> {
  console.log(`Client Service: Adding signer ${input.signerEmail} to document ${input.documentId} via API`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/add-signer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(input),
    });

    const responseData: ModifySignerResult = await response.json();
    if (!response.ok) {
      console.error("API error response during add signer:", response.status, responseData);
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to add signer.",
      };
    }
    console.log("Client Service: Add signer API call successful:", responseData);
    return responseData;
  } catch (error: any) {
    console.error("Client Service: Error in addSignerToDocumentClientAction fetch call:", error);
    return {
      success: false,
      message: "Failed to add signer due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

/**
 * [NEW] Client-side function to remove a signer from a document.
 * @param input Data required to remove the signer.
 * @returns A Promise resolving to ModifySignerResult.
 */
export async function removeSignerFromDocumentClientAction(
  input: RemoveSignerFromDocumentInput
): Promise<ModifySignerResult> {
  console.log(`Client Service: Removing signer ${input.signerEmailToRemove} from document ${input.documentId} via API`);

  try {
    const response = await fetch(`${effectiveApiRoot}${API_BASE_PATH}/remove-signer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(input),
    });

    const responseData: ModifySignerResult = await response.json();
    if (!response.ok) {
      console.error("API error response during remove signer:", response.status, responseData);
      return {
        success: false,
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to remove signer.",
      };
    }
    console.log("Client Service: Remove signer API call successful:", responseData);
    return responseData;
  } catch (error: any) {
    console.error("Client Service: Error in removeSignerFromDocumentClientAction fetch call:", error);
    return {
      success: false,
      message: "Failed to remove signer due to a network or client-side error.",
      error: error.message || "An unexpected error occurred while trying to contact the server.",
    };
  }
}

