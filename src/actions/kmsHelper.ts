import { type DecryptKmsApiResponse, type DecryptKmsApiInput } from '../types/types'; // Assuming types are in app/types.ts

// Re-use API root configuration.
// It's good practice to use an environment variable for this.
// For example, in your .env.local file: NEXT_PUBLIC_API_ROOT=http://localhost:3001
// Since this helper might be used by Server Actions (running server-side),
// we can also use a server-side environment variable if NEXT_PUBLIC_ is not appropriate.
// For simplicity here, we'll assume a general API_ROOT.
const API_ROOT = "http://localhost:3001"; // Use Vite's way to access env variables
const API_BASE_PATH = "/api/actions"; // Matches your Express server routes

let effectiveApiRoot = API_ROOT;
if (!effectiveApiRoot) {
    console.warn(
        "VITE_API_ROOT environment variable is not set for kmsHelper. Defaulting to http://localhost:3001 for API calls. " +
        "Please set this in your .env file (e.g., VITE_API_ROOT=http://localhost:3001) at the project root for robust configuration."
    );
    effectiveApiRoot = "http://localhost:3001";
}

/**
 * Calls the external Express API to decrypt base64 encoded ciphertext.
 * @param ciphertextBase64 The base64 encoded ciphertext string to decrypt.
 * @returns Promise<DecryptKmsApiResponse> - The full response from the API.
 *          The caller (e.g., decryptKmsAction) will adapt this to its needs.
 */
export async function decryptWithKmsViaApi(
  ciphertextBase64: string
): Promise<DecryptKmsApiResponse> {
  if (!ciphertextBase64) {
    console.error("decryptWithKmsViaApi: No ciphertext provided.");
    return { success: false, message: "No ciphertext provided.", error: "Missing input.", data: null };
  }

  const input: DecryptKmsApiInput = { ciphertextBase64 };
  const endpoint = `${effectiveApiRoot}${API_BASE_PATH}/decrypt-kms`;
  console.log(`kmsHelper: Calling external API to decrypt data: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(input),
    });

    // Try to parse JSON regardless of status code, as API might return JSON error details
    const responseData: DecryptKmsApiResponse = await response.json();

    if (!response.ok) {
      console.error(`kmsHelper: API error response from ${endpoint}:`, response.status, responseData);
      return {
        success: false,
        data: responseData?.data || null, // API might structure error with null data
        message: responseData?.message || `API request failed with status ${response.status}`,
        error: responseData?.error || "Failed to decrypt via API.",
      };
    }

    // Check if the successful response contains the expected plaintext data
    if (responseData.success && (!responseData.data || typeof responseData.data.plaintext !== 'string')) {
        console.error(`kmsHelper: API success response from ${endpoint} missing or invalid plaintext data:`, responseData);
        return {
            success: false,
            data: null,
            message: "API indicated success but returned invalid or missing plaintext data.",
            error: "Invalid data format from API.",
        };
    }

    console.log(`kmsHelper: Decryption API call successful from ${endpoint}.`);
    return responseData; // This is of type DecryptKmsApiResponse

  } catch (error: any) {
    console.error(`kmsHelper: Network or fetch error calling ${endpoint}:`, error);
    return {
      success: false,
      data: null,
      message: "Failed to decrypt due to a network or client-side fetch error.",
      error: error.message || "An unexpected error occurred while trying to contact the decryption server.",
    };
  }
}

