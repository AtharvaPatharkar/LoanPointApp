/**
 * ImageKit Upload and Media Storage Service
 * Handles direct upload of documents, photos, and PDFs to ImageKit.io CDN storage
 */
import { Platform } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system/legacy';

export interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  height?: number;
  width?: number;
  size: number;
  filePath: string;
  fileType: string;
}

const IMAGEKIT_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';

const getPrivateKey = (): string => {
  return (
    process.env.EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY ||
    'private_LGd0VI3JkHxbCnN9SiygnCeSDGY='
  );
};

const getPublicKey = (): string => {
  return (
    process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
    'public_kxUXTWifMEP5QE8wsZ4tGWbe81I='
  );
};

const getUrlEndpoint = (): string => {
  return (
    process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
    'https://ik.imagekit.io/1a0frqp2f'
  );
};

// Cross-platform Base64 encoder for browser, React Native, and Node environments
const encodeBase64 = (str: string): string => {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    if (charCode > 0xff) {
      throw new Error("'btoa' failed: The string contains characters outside Latin1.");
    }
    block = (block << 8) | charCode;
  }
  return output;
};

export const imageKitService = {
  getPublicKey,
  getPrivateKey,
  getUrlEndpoint,

  /**
   * Upload file to ImageKit CDN
   * Uses URL-encoded Base64 string payload on React Native to avoid FormData multipart engine bugs.
   * @param fileData base64 data URI string or binary Blob/File or native file URI
   * @param fileName desired file name
   * @param folder destination folder on ImageKit (e.g. /loanpoint_vault)
   */
  async uploadFile(
    fileData: string | Blob,
    fileName: string,
    folder: string = '/loanpoint_vault'
  ): Promise<ImageKitUploadResponse> {
    const privateKey = getPrivateKey();
    const authHeader = `Basic ${encodeBase64(`${privateKey}:`)}`;

    let base64Payload = '';

    // 1. Convert native file:// or content:// URI to Base64
    if (
      typeof fileData === 'string' &&
      (fileData.startsWith('file://') || fileData.startsWith('content://'))
    ) {
      try {
        const rawBase64 = await FileSystemLegacy.readAsStringAsync(fileData, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
        const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
        const mime = ext === 'pdf' ? 'application/pdf' : `image/${ext === 'png' ? 'png' : 'jpeg'}`;
        base64Payload = `data:${mime};base64,${rawBase64}`;
      } catch (readErr) {
        console.warn('Could not read file as base64 string:', readErr);
        base64Payload = fileData;
      }
    } else if (typeof fileData === 'string') {
      base64Payload = fileData;
    }

    // 2. On Web: If we have a binary Blob/File, use standard Web FormData
    if (Platform.OS === 'web' && typeof Blob !== 'undefined' && fileData instanceof Blob) {
      const formData = new FormData();
      formData.append('file', fileData, fileName);
      formData.append('fileName', fileName);
      formData.append('folder', folder);
      formData.append('useUniqueFileName', 'true');

      const response = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ImageKit Upload Error: ${errorText}`);
      }

      const result = await response.json();
      return result;
    }

    // 3. React Native / Mobile Platform: Use URL-encoded body
    // This completely bypasses React Native's FormDataPart native bug ("Unsupported FormDataPart implementation")
    const formParams = new URLSearchParams();
    formParams.append('file', base64Payload);
    formParams.append('fileName', fileName);
    formParams.append('folder', folder);
    formParams.append('useUniqueFileName', 'true');

    const response = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formParams.toString(),
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('ImageKit Upload Failed:', errorText);
      throw new Error(`ImageKit Upload Error: ${errorText}`);
    }

    const result = await response.json();
    return {
      fileId: result.fileId,
      name: result.name,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      size: result.size,
      filePath: result.filePath,
      fileType: result.fileType,
      height: result.height,
      width: result.width,
    };
  },
};
