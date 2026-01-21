
/**
 * TEXTA CRYPTOGRAPHIC NODE
 * Implements AES-GCM 256-bit encryption for client-side data shielding.
 */

const ENCRYPTION_KEY_SEED = "texta-lab-intelligence-secure-v0"; // In production, this would be derived from user session

async function getDerivedKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = encoder.encode(ENCRYPTION_KEY_SEED);
  const hash = await crypto.subtle.digest('SHA-256', rawKey);
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export const EncryptionService = {
  encrypt: async (data: any): Promise<{ ciphertext: string; iv: string }> => {
    const key = await getDerivedKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
      iv: btoa(String.fromCharCode(...iv))
    };
  },

  decrypt: async (ciphertextBase64: string, ivBase64: string): Promise<any> => {
    const key = await getDerivedKey();
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(ciphertextBase64).split('').map(c => c.charCodeAt(0)));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }
};
