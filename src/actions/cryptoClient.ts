// Utility functions for browser-side crypto operations using Web Crypto API

/**
 * Converts an ArrayBuffer to a Base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  /**
   * Exports a CryptoKey to PEM format (SPKI for public, PKCS8 for private).
   */
  async function exportKeyToPem(key: CryptoKey, type: 'public' | 'private'): Promise<string> {
    const format = type === 'public' ? 'spki' : 'pkcs8';
    const exported = await window.crypto.subtle.exportKey(format, key);
    const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
    const exportedAsBase64 = window.btoa(exportedAsString);
    const header = type === 'public' ? '-----BEGIN PUBLIC KEY-----' : '-----BEGIN PRIVATE KEY-----';
    const footer = type === 'public' ? '-----END PUBLIC KEY-----' : '-----END PRIVATE KEY-----';
    return `${header}\n${exportedAsBase64.match(/.{1,64}/g)?.join('\n') ?? ''}\n${footer}`;
  }
  
  /**
   * Generates an RSA-OAEP 2048-bit key pair.
   * Returns public and private keys in PEM format.
   */
  export async function generateRoomKeyPairPem(): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
    console.log("Generating RSA key pair for room...");
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"] // Key usages (decrypt needed for private key)
    );
    console.log("Key pair generated.");
  
    if (!keyPair.publicKey || !keyPair.privateKey) {
        throw new Error("Failed to generate key pair properties.");
    }
  
    const publicKeyPem = await exportKeyToPem(keyPair.publicKey, 'public');
    const privateKeyPem = await exportKeyToPem(keyPair.privateKey, 'private');
    console.log("Keys exported to PEM format.");
  
    return { publicKeyPem, privateKeyPem };
  }
  
  
  /**
   * Encrypts data using the Arweave Wallet Kit API (e.g., Othent).
   * Takes a PEM string, converts to ArrayBuffer, encrypts, returns Base64 bundle.
   */
  export async function encryptPrivateKeyWithAwk(
      privateKeyPem: string,
      api: any // The API object from useApi()
   ): Promise<string> {
      if (!api?.encrypt) {
          throw new Error("Arweave Wallet Kit API or encrypt function is not available.");
      }
      console.log("Encrypting private key using AWK api.encrypt...");
      // Convert PEM string to ArrayBuffer for encryption
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(privateKeyPem);
  
      try {
          const encryptedBuffer = await api.encrypt(dataBuffer); // Use AWK's encrypt
          if (!encryptedBuffer || encryptedBuffer.byteLength === 0) {
               throw new Error("AWK encryption returned empty result.");
          }
          const encryptedBase64 = arrayBufferToBase64(encryptedBuffer);
          console.log("Private key encrypted successfully via AWK.");
          return encryptedBase64;
      } catch (error: any) {
           console.error("Error during AWK encryption:", error);
           throw new Error(`Failed to encrypt private key using wallet: ${error.message}`);
      }
   }
   