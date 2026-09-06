import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_STORAGE_KEY = 'havn_encryption_key';
const NONCE_LENGTH_BYTES = 12;

let cachedKey: Uint8Array | null = null;

async function getEncryptionKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;

  let hex = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
  if (!hex) {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    hex = bytesToHex(keyBytes);
    await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, hex);
  }

  cachedKey = hexToBytes(hex);
  return cachedKey;
}

export async function encryptValue(value: string): Promise<string> {
  const key = await getEncryptionKey();
  const nonce = await Crypto.getRandomBytesAsync(NONCE_LENGTH_BYTES);
  const ciphertext = gcm(key, nonce).encrypt(utf8ToBytes(value));
  return `${bytesToHex(nonce)}:${bytesToHex(ciphertext)}`;
}

export async function decryptValue(payload: string): Promise<string> {
  const key = await getEncryptionKey();
  const [nonceHex, ciphertextHex] = payload.split(':');
  const nonce = hexToBytes(nonceHex);
  const ciphertext = hexToBytes(ciphertextHex);
  const plaintext = gcm(key, nonce).decrypt(ciphertext);
  return bytesToUtf8(plaintext);
}

export async function encryptNumber(value: number): Promise<string> {
  return encryptValue(String(value));
}

export async function decryptNumber(payload: string): Promise<number> {
  return Number(await decryptValue(payload));
}

export async function encryptNullable(value: string | null): Promise<string | null> {
  return value === null ? null : encryptValue(value);
}

export async function decryptNullable(payload: string | null): Promise<string | null> {
  return payload === null ? null : decryptValue(payload);
}
