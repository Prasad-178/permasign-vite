// import { decryptWithKms } from './kmsHelper'; // OLD import
import { ActionResult } from '../types/types'; // ActionResult is still relevant here
import { decryptWithKmsViaApi } from './kmsHelper';

/**
 * Server action to decrypt data (specifically the room private key) using KMS
 * by calling an external API.
 * @param encryptedDataB64 Base64 encoded encrypted data.
 * @returns ActionResult containing the decrypted plaintext string or an error.
 */
export async function decryptKmsAction(encryptedDataB64: string): Promise<ActionResult<string>> {
    console.log("Action: decryptKmsAction called, will use external API via kmsHelper.");
    if (!encryptedDataB64) {
        return { success: false, message: "No encrypted data provided.", error: "Missing input." };
    }

    try {
        // Call the new kmsHelper function that hits the Express API
        const apiResult = await decryptWithKmsViaApi(encryptedDataB64);

        if (apiResult.success && apiResult.data?.plaintext) {
            console.log("KMS decryption successful via external API.");
            // Adapt the API result to the expected ActionResult<string>
            return {
                success: true,
                data: apiResult.data.plaintext,
                message: apiResult.message || "Decryption successful via API."
            };
        } else {
            console.error("Error from decryptWithKmsViaApi:", apiResult.error, apiResult.message);
            // Adapt the API error to the expected ActionResult<string>
            return {
                success: false,
                message: apiResult.message || "Failed to decrypt data using external KMS API.",
                error: apiResult.error || "Unknown error from KMS API call.",
            };
        }
    } catch (error: any) { // This catch is for errors in calling decryptWithKmsViaApi itself, though it's designed to not throw
        console.error("Unexpected error in decryptKmsAction when calling helper:", error);
        return {
            success: false,
            message: "An unexpected error occurred while attempting KMS decryption.",
            error: error.message || String(error),
        };
    }
}
