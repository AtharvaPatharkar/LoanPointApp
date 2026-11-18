/**
 * ImageKit Upload and Media Storage Service
 * Uses Secure Backend Authentication Parameters or Backend Relay
 * Eliminates client-side private key and basic authentication exposure
 */
import { Platform } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { apiRequest } from './apiClient';

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

export const imageKitService = {
  getPublicKey,
  getUrlEndpoint,

  /**
   * Fetch secure ImageKit upload authentication parameters from backend
   */
  async getAuthParameters(): Promise<{ token: string; expire: number; signature: string; publicKey: string }> {
    const res = await apiRequest('/imagekit/auth', { method: 'GET' });
    return {
      token: res.token,
      expire: res.expire,
      signature: res.signature,
      publicKey: res.publicKey || getPublicKey(),
    };
  },

  /**
   * Upload file to ImageKit CDN using secure backend-signed parameters
   */
  async uploadFile(
    fileData: string | Blob,
    fileName: string,
    folder: string = '/loanpoint_vault'
  ): Promise<ImageKitUploadResponse> {
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

    // Try Backend relay upload first (safest, handles all platform boundaries)
    try {
      const backendRes = await apiRequest('/imagekit/upload', {
        method: 'POST',
        body: {
          fileData: base64Payload,
          fileName,
          folder,
        },
      });
      if (backendRes.file) {
        return backendRes.file;
      }
    } catch (backendUploadErr) {
      console.warn('Backend upload relay failed, attempting direct upload with signed parameters:', backendUploadErr);
    }

    // Direct Upload using backend-signed auth parameters
    const authParams = await this.getAuthParameters();

    if (Platform.OS === 'web' && typeof Blob !== 'undefined' && fileData instanceof Blob) {
      const formData = new FormData();
      formData.append('file', fileData, fileName);
      formData.append('fileName', fileName);
      formData.append('folder', folder);
      formData.append('useUniqueFileName', 'true');
      formData.append('token', authParams.token);
      formData.append('expire', String(authParams.expire));
      formData.append('signature', authParams.signature);
      formData.append('publicKey', authParams.publicKey);

      const response = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ImageKit Upload Error: ${errorText}`);
      }

      return await response.json();
    }

    // React Native / Mobile URL-encoded body
    const formParams = new URLSearchParams();
    formParams.append('file', base64Payload);
    formParams.append('fileName', fileName);
    formParams.append('folder', folder);
    formParams.append('useUniqueFileName', 'true');
    formParams.append('token', authParams.token);
    formParams.append('expire', String(authParams.expire));
    formParams.append('signature', authParams.signature);
    formParams.append('publicKey', authParams.publicKey);

    const response = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formParams.toString(),
      headers: {
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
