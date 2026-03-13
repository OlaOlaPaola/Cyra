/**
 * Módulo de encriptación AES-256-GCM
 * 
 * Este módulo se encarga exclusivamente de encriptar datos sensibles del usuario
 * utilizando el esquema AES-256-GCM.
 */

export interface EncryptionInput {
  userId: string;
  userData: Record<string, unknown> | { [key: string]: unknown };
  aiPrompt: string;
}

export interface EncryptionResult {
  ciphertext: string; // base64
  iv: string; // base64
  aesKey: string; // base64
  tag: string; // base64
}

/**
 * Convierte un ArrayBuffer a string base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convierte un string a ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

/**
 * Genera una clave AES-256 segura (32 bytes)
 */
async function generateAESKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // 256 bits = 32 bytes
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Genera un IV seguro (12 bytes para GCM)
 */
function generateIV(): Uint8Array {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  return iv;
}

/**
 * Encripta datos usando AES-256-GCM
 * 
 * @param input - Objeto con userId, userData y aiPrompt
 * @returns Objeto con ciphertext, iv, aesKey y tag en base64
 */
export async function encryptUserData(
  input: EncryptionInput
): Promise<EncryptionResult> {
  try {
    // 1. Generar clave AES-256 (32 bytes)
    const key = await generateAESKey();

    // 2. Generar IV seguro (12 bytes)
    const ivArray = generateIV();
    // Crear un nuevo ArrayBuffer desde el Uint8Array para asegurar compatibilidad de tipos
    const iv = new Uint8Array(ivArray.length);
    iv.set(ivArray);

    // 3. Preparar los datos para encriptar
    // Combinamos userData y aiPrompt en un objeto JSON
    const dataToEncrypt = {
      userData: input.userData,
      aiPrompt: input.aiPrompt,
    };

    // 🔍 DEBUG: Ver qué se está encriptando (solo en desarrollo)
    // Descomenta la siguiente línea para ver los datos antes de encriptar:
    // console.log('📦 Datos que se van a encriptar:', JSON.stringify(dataToEncrypt, null, 2));

    // Convertir a JSON string
    const plaintext = JSON.stringify(dataToEncrypt);

    // Convertir a ArrayBuffer
    const plaintextBuffer = stringToArrayBuffer(plaintext);

    // 4. Exportar la clave para obtener el aesKey en base64
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const aesKeyBase64 = arrayBufferToBase64(exportedKey);

    // 5. Encriptar usando AES-256-GCM
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // 128 bits para el tag de autenticación
      },
      key,
      plaintextBuffer
    );

    // 6. Extraer ciphertext y tag
    // En GCM, el tag está al final del encryptedData (16 bytes)
    const tagLength = 16; // 128 bits = 16 bytes
    const ciphertextLength = encryptedData.byteLength - tagLength;
    
    const ciphertext = encryptedData.slice(0, ciphertextLength);
    const tag = encryptedData.slice(ciphertextLength);

    // 7. Convertir todo a base64
    // Crear un nuevo ArrayBuffer desde el IV para asegurar compatibilidad de tipos
    const ivBuffer = new ArrayBuffer(iv.length);
    new Uint8Array(ivBuffer).set(iv);
    
    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(ivBuffer),
      aesKey: aesKeyBase64,
      tag: arrayBufferToBase64(tag),
    };
  } catch (error) {
    throw new Error(`Error al encriptar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

